const si = require('systeminformation');
const config = require('../../config');
const database = require('./database');
const logger = require('../utils/logger');

class NetworkMonitor {
  constructor() {
    this.currentStats = {};
    this.previousStats = {};
    this.interval = null;
    this.bandwidth = {};
  }

  async start() {
    logger.info('Starting network monitor');
    await this.collectStats();
    this.interval = setInterval(() => this.collectStats(), config.monitoring.networkInterval);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      logger.info('Network monitor stopped');
    }
  }

  async collectStats() {
    try {
      // Get network interfaces
      const interfaces = await si.networkInterfaces();
      const stats = await si.networkStats();

      for (const iface of stats) {
        const rx = iface.rx_bytes || 0;
        const tx = iface.tx_bytes || 0;
        const rxPackets = iface.rx_dropped || 0;
        const txPackets = iface.tx_dropped || 0;

        // Calculate bandwidth if we have previous data
        if (this.previousStats[iface.iface]) {
          const timeDiff = (config.monitoring.networkInterval / 1000); // seconds
          const rxBitsSec = ((rx - this.previousStats[iface.iface].rx) / timeDiff) * 8;
          const txBitsSec = ((tx - this.previousStats[iface.iface].tx) / timeDiff) * 8;

          this.bandwidth[iface.iface] = {
            rxMbps: parseFloat((rxBitsSec / 1024 / 1024).toFixed(2)),
            txMbps: parseFloat((txBitsSec / 1024 / 1024).toFixed(2)),
            rxBytes: rx,
            txBytes: tx
          };
        }

        // Store current stats for next calculation
        if (!this.previousStats[iface.iface]) {
          this.previousStats[iface.iface] = {};
        }
        this.previousStats[iface.iface].rx = rx;
        this.previousStats[iface.iface].tx = tx;

        // Store in database
        await database.insertNetworkStats({
          interface: iface.iface,
          bytesSent: tx,
          bytesReceived: rx,
          packetsSent: iface.tx_packets || 0,
          packetsReceived: iface.rx_packets || 0,
          errors: iface.rx_errors || 0,
          dropped: iface.rx_dropped || 0
        });

        this.currentStats[iface.iface] = {
          interface: iface.iface,
          bytesSent: tx,
          bytesReceived: rx,
          bandwidth: this.bandwidth[iface.iface] || { rxMbps: 0, txMbps: 0 }
        };
      }

      logger.debug('Network stats collected', this.currentStats);

    } catch (error) {
      logger.error('Error collecting network stats', { error: error.message });
    }
  }

  getCurrentStats() {
    return this.currentStats;
  }

  getBandwidth() {
    return this.bandwidth;
  }

  async getNetworkInterfaces() {
    try {
      const interfaces = await si.networkInterfaces();
      return interfaces.map(iface => ({
        name: iface.ifname || iface.iface,
        ip4: iface.ip4,
        ip6: iface.ip6,
        mac: iface.mac,
        type: iface.type,
        speed: iface.speed
      }));
    } catch (error) {
      logger.error('Error getting network interfaces', { error: error.message });
      return [];
    }
  }

  async getNetworkConnections() {
    try {
      const connections = await si.networkConnections();
      return connections.slice(0, 50); // Return top 50
    } catch (error) {
      logger.error('Error getting network connections', { error: error.message });
      return [];
    }
  }
}

module.exports = new NetworkMonitor();
