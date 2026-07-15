module.exports = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development'
  },

  // Database Configuration
  database: {
    path: process.env.DB_PATH || './data/l3mon.db',
    maxConnections: 10
  },

  // Monitoring Configuration
  monitoring: {
    networkInterval: 5000,        // 5 seconds
    serverInterval: 3000,         // 3 seconds
    systemInterval: 10000,        // 10 seconds
    dataRetention: 24 * 60 * 60,  // 24 hours in seconds
    maxDataPoints: 10000
  },

  // Alert Configuration
  alerts: {
    cpuThreshold: 80,
    memoryThreshold: 85,
    diskThreshold: 90,
    networkBandwidthThreshold: 90,
    alertCooldown: 300000 // 5 minutes
  },

  // Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'l3mon-secret-key-change-in-production',
    tokenExpiry: '24h',
    passwordMinLength: 8
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'combined'
  },

  // Feature Flags
  features: {
    enableRemoteAccess: true,
    enableCustomAlerts: true,
    enableDataExport: true,
    enableAPI: true
  }
};
