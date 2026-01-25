   module.exports = {
     apps: [{
       name: 'caravan-compliance-backend',
       script: 'server.js',
       instances: 1,
       autorestart: true,
       watch: false,
       max_memory_restart: '1G',
       env: {
         NODE_ENV: 'production',
         PORT: 5001
       },
       env_production: {
         NODE_ENV: 'production',
         PORT: 5001
       }
     }]
   };