// PM2 process definitions for Pi Auctions.
//
// Usage on the VPS:
//   pm2 start deploy/ecosystem.config.js --env production
//   pm2 save            # persist across reboots (after `pm2 startup`)
//   pm2 logs pi-auctions
//
// Secrets/config are loaded from an env file OUTSIDE the repo. Point PM2 at it
// with `--env-file /etc/pi-auctions.env` (PM2 v5.3+) or export the vars in the
// systemd/pm2 startup environment. Do NOT put real secrets in this file.

module.exports = {
  apps: [
    {
      // Web + API + Socket.IO (custom server.js)
      name: 'pi-auctions',
      script: 'server.js',
      cwd: '/var/www/pi-auctions/current',
      instances: 1, // keep at 1: Socket.IO + in-memory rate limiter are process-local
      exec_mode: 'fork',
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '127.0.0.1',
      },
      out_file: '/var/log/pi-auctions/out.log',
      error_file: '/var/log/pi-auctions/error.log',
      time: true,
    },
    {
      // Optional: the auction settlement/expiry worker (node-cron based).
      // Alternatively use the systemd timer in deploy/pi-auctions-settle.* instead.
      name: 'pi-auctions-worker',
      script: 'npm',
      args: 'run worker',
      cwd: '/var/www/pi-auctions/current',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
      },
      out_file: '/var/log/pi-auctions/worker-out.log',
      error_file: '/var/log/pi-auctions/worker-error.log',
      time: true,
    },
  ],
};
