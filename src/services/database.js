const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const config = require('../../config');
const logger = require('../utils/logger');

const dataDir = './data';
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(config.database.path, (err) => {
  if (err) {
    logger.error('Failed to connect to database', { error: err.message });
  } else {
    logger.info('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  // Network monitoring data
  db.run(`
    CREATE TABLE IF NOT EXISTS network_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      interface TEXT,
      bytes_sent INTEGER,
      bytes_received INTEGER,
      packets_sent INTEGER,
      packets_received INTEGER,
      errors INTEGER,
      dropped INTEGER
    )
  `);

  // Server/System monitoring data
  db.run(`
    CREATE TABLE IF NOT EXISTS server_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      cpu_usage REAL,
      memory_usage REAL,
      memory_available REAL,
      disk_usage REAL,
      uptime INTEGER,
      load_average REAL,
      processes_running INTEGER
    )
  `);

  // Alerts log
  db.run(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      alert_type TEXT,
      severity TEXT,
      message TEXT,
      value REAL,
      threshold REAL,
      resolved BOOLEAN DEFAULT 0,
      resolved_at DATETIME
    )
  `);

  // Users (for authentication)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);

  // Custom alerts configuration
  db.run(`
    CREATE TABLE IF NOT EXISTS custom_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      metric TEXT NOT NULL,
      threshold REAL NOT NULL,
      comparison TEXT,
      enabled BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  logger.info('Database initialized successfully');
}

// Database operations
const dbOperations = {
  // Network stats
  insertNetworkStats: (stats) => {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO network_stats 
        (interface, bytes_sent, bytes_received, packets_sent, packets_received, errors, dropped)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      db.run(sql, [
        stats.interface,
        stats.bytesSent,
        stats.bytesReceived,
        stats.packetsSent,
        stats.packetsReceived,
        stats.errors || 0,
        stats.dropped || 0
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  },

  getNetworkStats: (limit = 100) => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM network_stats ORDER BY timestamp DESC LIMIT ?',
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  },

  // Server stats
  insertServerStats: (stats) => {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO server_stats 
        (cpu_usage, memory_usage, memory_available, disk_usage, uptime, load_average, processes_running)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      db.run(sql, [
        stats.cpuUsage,
        stats.memoryUsage,
        stats.memoryAvailable,
        stats.diskUsage,
        stats.uptime,
        stats.loadAverage,
        stats.processesRunning
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  },

  getServerStats: (limit = 100) => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM server_stats ORDER BY timestamp DESC LIMIT ?',
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  },

  // Alerts
  insertAlert: (alert) => {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO alerts 
        (alert_type, severity, message, value, threshold)
        VALUES (?, ?, ?, ?, ?)
      `;
      db.run(sql, [
        alert.type,
        alert.severity,
        alert.message,
        alert.value,
        alert.threshold
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  },

  getAlerts: (limit = 50) => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM alerts ORDER BY timestamp DESC LIMIT ?',
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  },

  // Cleanup old data
  cleanupOldData: (hoursOld = 24) => {
    return new Promise((resolve, reject) => {
      const datetime = new Date(Date.now() - hoursOld * 60 * 60 * 1000).toISOString();
      
      db.run('DELETE FROM network_stats WHERE timestamp < ?', [datetime], (err) => {
        if (err) reject(err);
        else {
          db.run('DELETE FROM server_stats WHERE timestamp < ?', [datetime], (err) => {
            if (err) reject(err);
            else resolve();
          });
        }
      });
    });
  },

  // Get statistics summary
  getStatsSummary: () => {
    return new Promise((resolve, reject) => {
      Promise.all([
        new Promise((res, rej) => {
          db.get('SELECT AVG(cpu_usage) as avg_cpu, MAX(cpu_usage) as max_cpu FROM server_stats WHERE timestamp > datetime("now", "-1 hour")', (err, row) => {
            if (err) rej(err);
            else res(row || {});
          });
        }),
        new Promise((res, rej) => {
          db.get('SELECT AVG(memory_usage) as avg_mem, MAX(memory_usage) as max_mem FROM server_stats WHERE timestamp > datetime("now", "-1 hour")', (err, row) => {
            if (err) rej(err);
            else res(row || {});
          });
        })
      ]).then(([cpu, mem]) => {
        resolve({ cpu, memory: mem });
      }).catch(reject);
    });
  }
};

module.exports = {
  db,
  ...dbOperations
};
