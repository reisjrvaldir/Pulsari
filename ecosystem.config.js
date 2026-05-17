module.exports = {
  apps: [{
    name:        'pulsari',
    script:      './server/index.cjs',
    instances:   1,
    autorestart: true,
    watch:       false,
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'production',
      PORT:     3001,
    },
    env_production: {
      NODE_ENV: 'production',
      PORT:     3001,
    },
  }],
}
