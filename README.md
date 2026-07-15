# L3MON - Layer 3 Advanced Network Management and Monitoring System

![L3MON](https://img.shields.io/badge/L3MON-Network%20Monitoring-blue)
![Node.js](https://img.shields.io/badge/Node.js-v14+-green)
![License](https://img.shields.io/badge/license-MIT-blue)

A comprehensive network management and monitoring system built with Node.js, Express, and Socket.io. L3MON provides real-time monitoring of network bandwidth, server resources, and system performance with a web-based dashboard.

## Features

✅ **Real-time Monitoring**
- CPU, Memory, and Disk usage tracking
- Network bandwidth monitoring across all interfaces
- System uptime and load average monitoring
- Live updates via WebSocket (Socket.io)

✅ **Alert System**
- Configurable threshold-based alerts
- Alert history and logging
- Active alert management
- Alert cooldown mechanism to prevent spam

✅ **Authentication**
- JWT-based authentication
- User registration and login
- Secure password hashing with bcryptjs

✅ **Data Management**
- SQLite database for persistent storage
- Historical data tracking
- Automatic data cleanup (24-hour retention)
- Statistics summary and aggregation

✅ **API**
- REST API for all monitoring data
- Real-time WebSocket events
- JSON responses
- Comprehensive logging

## Installation

### Prerequisites
- Node.js 14.0 or higher
- npm or yarn

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/mfaizan70/L3MON.git
   cd L3MON
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Access the dashboard**
   Open your browser and navigate to: `http://localhost:3000`

## Configuration

Edit `config.js` to customize monitoring intervals, alert thresholds, and other settings:

```javascript
// Alert thresholds
alerts: {
  cpuThreshold: 80,           // CPU usage %
  memoryThreshold: 85,        // Memory usage %
  diskThreshold: 90,          // Disk usage %
  alertCooldown: 300000       // 5 minutes
},

// Monitoring intervals
monitoring: {
  networkInterval: 5000,      // 5 seconds
  serverInterval: 3000,       // 3 seconds
  systemInterval: 10000       // 10 seconds
}
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Server Monitoring
- `GET /api/stats/server/current` - Current server stats
- `GET /api/stats/server/history` - Server stats history (limit query param)
- `GET /api/health` - System health status
- `GET /api/system/info` - System information

### Network Monitoring
- `GET /api/stats/network/current` - Current network stats
- `GET /api/stats/network/history` - Network stats history
- `GET /api/network/interfaces` - Network interfaces info

### Alerts
- `GET /api/alerts/active` - Active alerts
- `GET /api/alerts/history` - All alerts history
- `PUT /api/alerts/:id/resolve` - Resolve an alert

### Statistics
- `GET /api/stats/summary` - Statistics summary (1 hour)

## WebSocket Events

### Client Events
- `request-stats` - Request current stats
- `request-alerts` - Request active alerts

### Server Events
- `stats-update` - Broadcast stats update (every 5 seconds)
- `new-alert` - New alert triggered
- `alerts-update` - Alert list update

## Database Schema

### Tables
- `network_stats` - Network interface statistics
- `server_stats` - Server resource statistics
- `alerts` - Alert history and logs
- `users` - User accounts
- `custom_alerts` - Custom alert configurations

## Docker Support

### Build and Run with Docker

```bash
# Build the image
docker build -t l3mon .

# Run the container
docker run -p 3000:3000 -v l3mon_data:/usr/src/app/data l3mon
```

## Default Credentials

- **Username:** admin
- **Password:** password

⚠️ **IMPORTANT:** Change these credentials in production!

## File Structure

```
L3MON/
├── src/
│   ├── services/
│   │   ├── database.js         # SQLite database operations
│   │   ├── serverMonitor.js    # CPU, memory, disk monitoring
│   │   ├── networkMonitor.js   # Network bandwidth monitoring
│   │   └── alertManager.js     # Alert management
│   ├── routes/
│   │   ├── api.js              # API endpoints
│   │   └── auth.js             # Authentication routes
│   ├── middleware/
│   │   └── auth.js             # JWT authentication middleware
│   ├── utils/
│   │   └── logger.js           # Logging utility
│   └── server.js               # Express and Socket.io setup
├── public/                      # Frontend files
├── logs/                        # Application logs
├── data/                        # SQLite database
├── config.js                    # Configuration
├── index.js                     # Application entry point
├── package.json                 # Dependencies
└── README.md                    # This file
```

## Monitoring Metrics

### Server Metrics
- CPU Usage (%)
- Memory Usage (%)
- Memory Available (MB)
- Disk Usage (%)
- System Uptime (seconds)
- Load Average
- Running Processes

### Network Metrics
- Bytes Sent/Received per interface
- Packets Sent/Received
- Network Errors
- Dropped Packets
- Bandwidth (Mbps)

## Logging

Logs are written to `logs/l3mon-YYYY-MM-DD.log` and console with the following levels:
- `ERROR` - Critical errors
- `WARN` - Warnings and alerts
- `INFO` - General information
- `DEBUG` - Debug information

## Performance Considerations

- Data is retained for 24 hours by default
- Old data is automatically cleaned up every hour
- Monitoring intervals can be adjusted in config.js
- WebSocket updates are sent every 5 seconds

## Troubleshooting

### Port Already in Use
```bash
# Change port in .env
PORT=3001
```

### Database Lock Error
- Ensure no other instances of L3MON are running
- Delete `data/l3mon.db` and restart

### High CPU Usage
- Increase monitoring intervals in config.js
- Reduce data retention period

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

L3MON is provided as-is. Ensure proper security measures are in place before deploying in production, including:
- Changing default credentials
- Using HTTPS/TLS
- Implementing proper firewall rules
- Running with minimal required permissions

## Support

For issues, questions, or suggestions, please open an issue on GitHub.
