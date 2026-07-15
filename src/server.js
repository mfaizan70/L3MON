const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('../config');
const logger = require('./utils/logger');

const serverMonitor = require('./services/serverMonitor');
const networkMonitor = require('./services/networkMonitor');
const alertManager = require('./services/alertManager');
const database = require('./services/database');

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

class Server {
  constructor() {
    this.app = express();
    this.httpServer = http.createServer(this.app);
    this.io = socketIo(this.httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketHandlers();
    this.setupMonitoring();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(express.static('public'));

    // Logging middleware
    this.app.use((req, res, next) => {
      logger.debug(`${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Auth routes
    this.app.use('/api/auth', authRoutes);

    // API routes
    this.app.use('/api', apiRoutes);

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date() });
    });

    // Main dashboard
    this.app.get('/', (req, res) => {
      res.sendFile(__dirname + '/../public/index.html');
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Not Found' });
    });
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      logger.info('Client connected', { socketId: socket.id });

      socket.on('disconnect', () => {
        logger.info('Client disconnected', { socketId: socket.id });
      });

      // Request current stats
      socket.on('request-stats', async () => {
        const serverStats = serverMonitor.getCurrentStats();
        const networkStats = networkMonitor.getCurrentStats();
        const bandwidth = networkMonitor.getBandwidth();
        
        socket.emit('stats-update', {
          server: serverStats,
          network: networkStats,
          bandwidth
        });
      });

      // Request alerts
      socket.on('request-alerts', async () => {
        const alerts = await alertManager.getActiveAlerts();
        socket.emit('alerts-update', alerts);
      });
    });

    // Alert listener
    alertManager.on('alert', (alert) => {
      this.io.emit('new-alert', alert);
    });
  }

  setupMonitoring() {
    // Start monitoring services
    serverMonitor.start();
    networkMonitor.start();

    // Periodic threshold checking
    setInterval(async () => {
      const serverStats = serverMonitor.getCurrentStats();
      const networkStats = networkMonitor.getCurrentStats();
      await alertManager.checkThresholds(serverStats, networkStats);

      // Broadcast stats to all connected clients
      this.io.emit('stats-update', {
        server: serverStats,
        network: networkStats,
        bandwidth: networkMonitor.getBandwidth()
      });
    }, 5000);

    // Periodic data cleanup
    setInterval(async () => {
      try {
        await database.cleanupOldData(24); // Keep 24 hours
        logger.debug('Old data cleaned up');
      } catch (error) {
        logger.error('Error cleaning up data', { error: error.message });
      }
    }, 60 * 60 * 1000); // Every hour
  }

  start() {
    this.httpServer.listen(config.server.port, config.server.host, () => {
      logger.info(`L3MON Server started`, {
        url: `http://${config.server.host}:${config.server.port}`,
        environment: config.server.env
      });
    });
  }

  stop() {
    serverMonitor.stop();
    networkMonitor.stop();
    this.httpServer.close(() => {
      logger.info('L3MON Server stopped');
    });
  }
}

module.exports = new Server();
