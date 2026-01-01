// In the Name of God, the Creative, the Originator
/**
 * PM2 Ecosystem Configuration for Atabat
 * @see https://pm2.io/docs/runtime/reference/ecosystem-file/
 */
module.exports = {
  apps: [
    {
      name: 'atabat',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
