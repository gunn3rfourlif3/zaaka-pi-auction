# Pi Auctions — Docker deployment

Runs the whole stack (app + MySQL + settlement worker) in containers. Requires
Docker Engine + the Compose plugin on the VPS.

## Files
- `Dockerfile` — multi-stage build of the Next.js + Socket.IO custom server.
- `docker-compose.yml` — `db`, `app`, `worker` services (+ optional `redis`, `edge` Nginx profiles).
- `.env.docker.example` — copy to `.env.docker` and fill in.
- `deploy/docker/docker-entrypoint.sh` — waits for the DB, runs `prisma migrate deploy`, starts the server.
- `deploy/docker/nginx.conf` — config for the optional containerized Nginx edge.

## Quick start (staging)

```bash
# 1. On the VPS, install Docker + Compose (once)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # re-login after this

# 2. Get the code
git clone https://github.com/gunn3rfourlif3/zaaka-pi-auction.git
cd zaaka-pi-auction

# 3. Configure secrets (sandbox/testnet for staging)
cp .env.docker.example .env.docker
nano .env.docker            # set MySQL passwords, rotated Pi keys, SESSION_SECRET, etc.

# 4. Build & start
docker compose --env-file .env.docker up -d --build

# 5. Watch logs / check health
docker compose logs -f app
curl -s http://127.0.0.1:3000/api/health      # {"status":"ok",...}
```

Migrations run automatically on `app` startup (the entrypoint retries until the
DB is ready). The `worker` service settles expired auctions every 10s.

## TLS / reverse proxy — two options

**A. Host Nginx (recommended, simplest).** The app is published on
`127.0.0.1:3000`. Point host Nginx at it and let Certbot manage TLS:
```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/pi-auctions
sudo sed -i 's/auction.example.com/YOUR_DOMAIN/g' /etc/nginx/sites-available/pi-auctions
sudo ln -s /etc/nginx/sites-available/pi-auctions /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d YOUR_DOMAIN
```

**B. Containerized Nginx (`edge` profile).** Issue certs on the host with
Certbot first (they live in `/etc/letsencrypt`), then:
```bash
docker compose --env-file .env.docker --profile edge up -d
```

## Optional Redis
```bash
docker compose --env-file .env.docker --profile redis up -d
```
Then set `REDIS_URL=redis://redis:6379` in `.env.docker` (used for future
shared rate-limiting / real-time scaling).

## Common operations

```bash
docker compose --env-file .env.docker up -d --build        # deploy / update
docker compose logs -f app worker                          # tail logs
docker compose exec app npx prisma migrate status          # check migrations
docker compose exec db mysqldump -u root -p zaaka_auction > backup.sql
docker compose down                                        # stop (keeps volumes/data)
docker compose down -v                                     # stop AND delete data (careful!)
```

## Verify
```bash
./deploy/smoke-test.sh http://127.0.0.1:3000    # or your https domain
```
Then walk `Pi_Auctions_Staging_Test_Plan.docx` end-to-end.

## Notes
- Set the Pi Developer Portal app URL to `https://YOUR_DOMAIN` or SDK auth fails.
- For an existing DB with data (not a fresh volume), baseline instead of creating tables:
  `docker compose exec app npx prisma migrate resolve --applied 20260725000000_init`.
- `.env.docker` is git-ignored; keep real secrets only there / in a secrets manager.
