const si = require('systeminformation');
const config = require('../../config');
const database = require('./database');
const logger = require('../utils/logger');

class ServerMonitor {
  constructor() {
    this.currentStats = {};
    this.previousStats = {};
    this.interval = null;
  }

  async start() {
    logger.info('Starting server monitor');
    this.collectStats();
    this.interval = setInterval(() => this.collectStats(), config.monitoring.serverInterval);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      logger.info('Server monitor stopped');
    }
  }

  async collectStats() {
    try {
      // Get CPU info
      const cpuData = await si.currentLoad();
      const cpuUsage = cpuData.currentLoad;

      // Get memory info
      const memData = await si.mem();
      const memoryUsage = (memData.used / memData.total) * 100;
      const memoryAvailable = memData.available;

      // Get disk info
      const diskData = await si.fsSize();
      const diskUsage = diskData.length > 0 
        ? ((diskData[0].used / diskData[0].size) * 100) 
        : 0;

      // Get system uptime
      const uptime = Math.floor(process.uptime());

      // Get load average
      const loadData = await si.currentLoad();
      const loadAverage = loadData.avgLoad;

      // Get processes
      const processData = await si.processes();
      const processesRunning = processData.all || 0;

      this.currentStats = {
        timestamp: new Date(),
        cpuUsage: parseFloat(cpuUsage.toFixed(2)),
        memoryUsage: parseFloat(memoryUsage.toFixed(2)),
        memoryAvailable: parseFloat((memoryAvailable / 1024 / 1024).toFixed(2)), // MB
        diskUsage: parseFloat(diskUsage.toFixed(2)),
        uptime,
        loadAverage: parseFloat(loadAverage.toFixed(2)),
        processesRunning
      };

      // Store in database
      await database.insertServerStats({
        cpuUsage: this.currentStats.cpuUsage,
        memoryUsage: this.currentStats.memoryUsage,
        memoryAvailable: this.currentStats.memoryAvailable,
        diskUsage: this.currentStats.diskUsage,
        uptime: this.currentStats.uptime,
        loadAverage: this.currentStats.loadAverage,
        processesRunning: this.currentStats.processesRunning
      });

      logger.debug('Server stats collected', this.currentStats);

    } catch (error) {
      logger.error('Error collecting server stats', { error: error.message });
    }
  }

  getCurrentStats() {
    return this.currentStats;
  }

  getSystemInfo() {
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      uptime: Math.floor(process.uptime())
    };
  }

  async getHealthStatus() {
    const stats = this.currentStats;
    const alerts = [];

    if (stats.cpuUsage > config.alerts.cpuThreshold) {
      alerts.push({
        type: 'cpu',
        severity: 'warning',
        message: `CPU usage is ${stats.cpuUsage}%`,
        value: stats.cpuUsage
      });
    }

    if (stats.memoryUsage > config.alerts.memoryThreshold) {
      alerts.push({
        type: 'memory',
        severity: 'warning',
        message: `Memory usage is ${stats.memoryUsage}%`,
        value: stats.memoryUsage
      });
    }

    if (stats.diskUsage > config.alerts.diskThreshold) {
      alerts.push({
        type: 'disk',
        severity: 'critical',
        message: `Disk usage is ${stats.diskUsage}%`,
        value: stats.diskUsage
      });
    }

    return {
      healthy: alerts.length === 0,
      stats,
      alerts
    };
  }
}

module.exports = new ServerMonitor();
