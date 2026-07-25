# Pi Auctions — VPS Deployment (Ubuntu + Nginx + PM2 + MySQL)

Step-by-step setup for the new VPS. Assumes a fresh **Ubuntu 22.04/24.04** box
and a domain pointed at its IP. Replace `auction.example.com` throughout.

Repo: `https://github.com/gunn3rfourlif3/zaaka-pi-auction.git`

> ⚠️ Complete the security work in `PHASE_0-2_CHANGES.md` first — most importantly
> **rotate every previously-committed secret**. Never deploy the old keys.

---

## 1. Server baseline (as root, once)

```bash
# Create a non-root deploy user
adduser deploy && usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy   # copy your SSH key

# Harden SSH: set `PermitRootLogin no` and `PasswordAuthentication no`
sudoedit /etc/ssh/sshd_config && systemctl restart ssh

# Firewall
ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw --force enable

# Automatic security updates + brute-force protection
apt update && apt install -y unattended-upgrades fail2ban
```

## 2. Install runtimes (as deploy)

```bash
# Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# MySQL 8, Nginx, Certbot, PM2
sudo apt install -y mysql-server nginx certbot python3-certbot-nginx
sudo npm install -g pm2

sudo mysql_secure_installation   # set a strong root password, remove test DB
```

## 3. Database

```bash
sudo mysql
```
```sql
CREATE DATABASE zaaka_auction CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'auction_app'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
-- Least privilege: no GRANT ALL
GRANT SELECT, INSERT, UPDATE, DELETE ON zaaka_auction.* TO 'auction_app'@'localhost';
FLUSH PRIVILEGES;
```
MySQL binds to localhost by default — keep it that way.

## 4. Secrets file (outside the repo)

```bash
sudo install -m 600 /dev/null /etc/pi-auctions.env
sudoedit /etc/pi-auctions.env
```
Fill in using `.env.production.example` as the template. At minimum:
```env
DATABASE_URL="mysql://auction_app:STRONG_PASSWORD_HERE@localhost:3306/zaaka_auction"
NODE_ENV=production
NEXTAUTH_URL="https://auction.example.com"
ALLOWED_ORIGINS="https://auction.example.com"
PI_API_KEY="...rotated..."
PI_CLIENT_SECRET="...rotated..."
PI_WALLET_SEED="...new wallet..."
PI_NETWORK_ENVIRONMENT="mainnet"
SESSION_SECRET="$(openssl rand -hex 32)"
CRON_SECRET="$(openssl rand -hex 32)"
ADMIN_UIDS="your-pi-uid"
```

## 5. Clone & first build

```bash
sudo mkdir -p /var/www/pi-auctions && sudo chown -R deploy:deploy /var/www/pi-auctions
git clone https://github.com/gunn3rfourlif3/zaaka-pi-auction.git /var/www/pi-auctions/current
cd /var/www/pi-auctions/current

sudo mkdir -p /var/log/pi-auctions && sudo chown -R deploy:deploy /var/log/pi-auctions

# Load env, install, migrate, build
set -a; source /etc/pi-auctions.env; set +a
npm ci
npx prisma generate
npx prisma migrate deploy       # if no migration history yet, see note below
npm run build
```

**Migration note:** the repo now ships a baseline migration at
`prisma/migrations/20260725000000_init/`.
- **Fresh database:** `prisma migrate deploy` creates all tables (incl. the
  `bids.pi_payment_id` unique index) — nothing else needed.
- **Existing database with data:** do NOT let it re-create tables. Baseline once:
  `npx prisma migrate resolve --applied 20260725000000_init`, then apply
  `prisma/manual_migration_phase2.sql` to add the unique index if missing.

## 6. Run under PM2

```bash
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup systemd -u deploy --hp /home/deploy   # run the printed command with sudo
```
Verify locally: `curl -s http://127.0.0.1:3000/api/health` → `{"status":"ok",...}`

## 7. Nginx + TLS

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/pi-auctions
sudo sed -i 's/auction.example.com/YOUR_DOMAIN/g' /etc/nginx/sites-available/pi-auctions
sudo ln -s /etc/nginx/sites-available/pi-auctions /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo mkdir -p /var/www/certbot
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx -d YOUR_DOMAIN     # issues + auto-renews the cert
```

## 8. Automated settlement

Two options — pick one:

**A. systemd timer (recommended, uses the protected endpoint):**
```bash
sudo cp deploy/pi-auctions-settle.service /etc/systemd/system/
sudo cp deploy/pi-auctions-settle.timer   /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now pi-auctions-settle.timer
```
If you use this, remove the `pi-auctions-worker` app from `ecosystem.config.js`.

**B. PM2 worker:** keep `pi-auctions-worker` in the ecosystem file (node-cron based).

## 9. Subsequent deploys

Manually:
```bash
cd /var/www/pi-auctions/current && ./deploy/deploy.sh
```

Or automatically via GitHub Actions (`.github/workflows/ci-cd.yml`): every push to
`main` runs lint/typecheck/build, then SSHes to the VPS and runs `deploy.sh`.

**Required GitHub repository secrets** (Settings → Secrets and variables → Actions):

| Secret         | Value                                                        |
|----------------|-------------------------------------------------------------|
| `VPS_HOST`     | Server IP or hostname                                       |
| `VPS_USER`     | `deploy`                                                    |
| `VPS_PORT`     | SSH port (e.g. `22`)                                        |
| `VPS_SSH_KEY`  | Private key whose public half is in `deploy`'s `authorized_keys` |

Generate a dedicated deploy key: `ssh-keygen -t ed25519 -C "gha-deploy" -f gha_deploy`,
add `gha_deploy.pub` to `/home/deploy/.ssh/authorized_keys`, and paste `gha_deploy`
into `VPS_SSH_KEY`. For safety, add a `production` GitHub Environment with a required
reviewer so deploys need approval.

---

## Verification checklist

Run the automated smoke test first (checks liveness + that auth is enforced):
```bash
./deploy/smoke-test.sh https://YOUR_DOMAIN
```

- [ ] `https://YOUR_DOMAIN` loads over TLS (A grade on SSL Labs).
- [ ] `curl https://YOUR_DOMAIN/api/health` returns ok.
- [ ] Signing in with Pi sets a `pa_session` cookie; API calls succeed only when signed in.
- [ ] A bid places, broadcasts live (Socket.IO), and is rejected if not strictly higher.
- [ ] Expired auctions settle automatically (watch `systemctl list-timers` or PM2 worker logs).
- [ ] `pm2 resurrect` after a reboot brings the app back (test with `sudo reboot`).
- [ ] Nightly `mysqldump` backup configured and a restore tested.

## Backups (add to deploy user's crontab)

```bash
0 3 * * * /usr/bin/mysqldump zaaka_auction | gzip > /var/backups/auction-$(date +\%F).sql.gz
```
Ship these off-box (object storage / another host) and test a restore before launch.
