const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const config = require('../../config');
const logger = require('../utils/logger');

// Simple in-memory user store (use database in production)
const users = new Map();

// Initialize with default user
users.set('admin', {
  id: 1,
  username: 'admin',
  password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DxJiTm', // hashed 'password'
  email: 'admin@l3mon.local'
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    if (password.length < config.auth.passwordMinLength) {
      return res.status(400).json({ 
        error: `Password must be at least ${config.auth.passwordMinLength} characters` 
      });
    }

    if (users.has(username)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await auth.hashPassword(password);
    const userId = users.size + 1;

    users.set(username, {
      id: userId,
      username,
      password: hashedPassword,
      email: email || ''
    });

    logger.info('New user registered', { username });

    res.status(201).json({ 
      success: true, 
      message: 'User registered successfully' 
    });
  } catch (error) {
    logger.error('Registration error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = users.get(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordValid = await auth.comparePassword(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = auth.generateToken(user.id, user.username);

    logger.info('User logged in', { username });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    logger.error('Login error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', auth.verifyToken, (req, res) => {
  try {
    const user = users.get(req.user.username);
    res.json({
      id: user.id,
      username: user.username,
      email: user.email
    });
  } catch (error) {
    logger.error('Error getting current user', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
