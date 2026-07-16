module.exports = {
  apps: [
    {
      name: 'mysudoku',
      script: 'node_modules/.bin/next',
      args: 'start -p 3003',
      cwd: '/opt/mysudoku',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: '3003',
        DATABASE_PATH: '/opt/mysudoku/data/mysudoku.db',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/opt/mysudoku/logs/error.log',
      out_file: '/opt/mysudoku/logs/out.log',
      merge_logs: true,
      max_memory_restart: '512M',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
};
