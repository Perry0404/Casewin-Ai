module.exports = {
  apps: [
    {
      name: 'casewin-web',
      script: 'npm',
      args: 'start',
      cwd: './apps/web',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'casewin-whatsapp-bot',
      script: 'npm',
      args: 'start',
      cwd: './apps/whatsapp-bot',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
