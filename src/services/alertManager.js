const config = require('../../config');
const database = require('./database');
const logger = require('../utils/logger');

class AlertManager {
  constructor() {
    this.alerts = new Map();
    this.alertCooldowns = new Map();
    this.listeners = [];
  }

  on(event, callback) {
    this.listeners.push({ event, callback });
  }

  emit(event, data) {
    this.listeners
      .filter(l => l.event === event)
      .forEach(l => l.callback(data));
  }

  async checkThresholds(serverStats, networkStats) {
    const newAlerts = [];

    // CPU Check
    if (serverStats.cpuUsage > config.alerts.cpuThreshold) {
      newAlerts.push({
        type: 'cpu',
        severity: 'warning',
        message: `CPU usage is high: ${serverStats.cpuUsage}%`,
        value: serverStats.cpuUsage,
        threshold: config.alerts.cpuThreshold
      });
    }

    // Memory Check
    if (serverStats.memoryUsage > config.alerts.memoryThreshold) {
      newAlerts.push({
        type: 'memory',
        severity: 'warning',
        message: `Memory usage is high: ${serverStats.memoryUsage}%`,
        value: serverStats.memoryUsage,
        threshold: config.alerts.memoryThreshold
      });
    }

    // Disk Check
    if (serverStats.diskUsage > config.alerts.diskThreshold) {
      newAlerts.push({
        type: 'disk',
        severity: 'critical',
        message: `Disk usage is critical: ${serverStats.diskUsage}%`,
        value: serverStats.diskUsage,
        threshold: config.alerts.diskThreshold
      });
    }

    // Process and save alerts
    for (const alert of newAlerts) {
      await this.triggerAlert(alert);
    }
  }

  async triggerAlert(alert) {
    const alertKey = `${alert.type}_${alert.severity}`;
    const now = Date.now();
    const lastAlert = this.alertCooldowns.get(alertKey);

    // Check cooldown period
    if (lastAlert && (now - lastAlert) < config.alerts.alertCooldown) {
      return; // Skip if in cooldown
    }

    // Save to database
    await database.insertAlert(alert);

    // Update cooldown
    this.alertCooldowns.set(alertKey, now);

    // Emit event
    this.emit('alert', alert);

    logger.warn(`Alert triggered: ${alert.message}`, alert);
  }

  async getActiveAlerts() {
    try {
      const alerts = await database.getAlerts(50);
      return alerts.filter(a => !a.resolved);
    } catch (error) {
      logger.error('Error getting active alerts', { error: error.message });
      return [];
    }
  }

  async getAllAlerts(limit = 100) {
    try {
      return await database.getAlerts(limit);
    } catch (error) {
      logger.error('Error getting alerts', { error: error.message });
      return [];
    }
  }

  async resolveAlert(alertId) {
    try {
      return new Promise((resolve, reject) => {
        database.db.run(
          'UPDATE alerts SET resolved = 1, resolved_at = CURRENT_TIMESTAMP WHERE id = ?',
          [alertId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    } catch (error) {
      logger.error('Error resolving alert', { error: error.message });
    }
  }
}

module.exports = new AlertManager();
