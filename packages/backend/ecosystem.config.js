module.exports = {
  apps: [
    {
      name: 'alauncher-backend',
      script: './dist/index.js',
      cwd: '/opt/ALauncher/packages/backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 7240
      },
      error_file: '/var/log/alauncher-backend-error.log',
      out_file: '/var/log/alauncher-backend-out.log',
      log_file: '/var/log/alauncher-backend-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    }
  ]
};
