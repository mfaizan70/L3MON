const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const database = require('../services/database');
const serverMonitor = require('../services/serverMonitor');
const networkMonitor = require('../services/networkMonitor');
const alertManager = require('../services/alertManager');
const logger = require('../utils/logger');

// Protected routes - require authentication
router.use(auth.verifyToken);

// Get current server stats
router.get('/stats/server/current', (req, res) => {
  try {
    const stats = serverMonitor.getCurrentStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error getting current server stats', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Get server stats history
router.get('/stats/server/history', async (req, res) => {
  try {
    const limit = req.query.limit || 100;
    const stats = await database.getServerStats(limit);
    res.json(stats);
  } catch (error) {
    logger.error('Error getting server stats history', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Get current network stats
router.get('/stats/network/current', (req, res) => {
  try {
    const stats = networkMonitor.getCurrentStats();
    const bandwidth = networkMonitor.getBandwidth();
    res.json({ stats, bandwidth });
  } catch (error) {
    logger.error('Error getting network stats', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Get network stats history
router.get('/stats/network/history', async (req, res) => {
  try {
    const limit = req.query.limit || 100;
    const stats = await database.getNetworkStats(limit);
    res.json(stats);
  } catch (error) {
    logger.error('Error getting network stats history', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Get network interfaces
router.get('/network/interfaces', async (req, res) => {
  try {
    const interfaces = await networkMonitor.getNetworkInterfaces();
    res.json(interfaces);
  } catch (error) {
    logger.error('Error getting network interfaces', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Get active alerts
router.get('/alerts/active', async (req, res) => {
  try {
    const alerts = await alertManager.getActiveAlerts();
    res.json(alerts);
  } catch (error) {
    logger.error('Error getting active alerts', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Get all alerts
router.get('/alerts/history', async (req, res) => {
  try {
    const limit = req.query.limit || 100;
    const alerts = await alertManager.getAllAlerts(limit);
    res.json(alerts);
  } catch (error) {
    logger.error('Error getting alerts history', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Resolve alert
router.put('/alerts/:id/resolve', async (req, res) => {
  try {
    await alertManager.resolveAlert(req.params.id);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error resolving alert', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Get health status
router.get('/health', async (req, res) => {
  try {
    const status = await serverMonitor.getHealthStatus();
    res.json(status);
  } catch (error) {
    logger.error('Error getting health status', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Get system info
router.get('/system/info', (req, res) => {
  try {
    const info = serverMonitor.getSystemInfo();
    res.json(info);
  } catch (error) {
    logger.error('Error getting system info', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Get statistics summary
router.get('/stats/summary', async (req, res) => {
  try {
    const summary = await database.getStatsSummary();
    res.json(summary);
  } catch (error) {
    logger.error('Error getting stats summary', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
