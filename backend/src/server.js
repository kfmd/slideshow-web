require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

// Import routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const slideshowRoutes = require('./routes/slideshows');
const statsRoutes = require('./routes/stats');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname, '../frontend/public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/slideshows', slideshowRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database schema
async function initializeDatabase() {
  try {
    const fs = require('fs');
    const initSqlPath = path.join(__dirname, 'db-init.sql');
    
    if (fs.existsSync(initSqlPath)) {
      const initSql = fs.readFileSync(initSqlPath, 'utf8');
      await db.pool.query(initSql);
      console.log('✓ Database schema initialized');
    }
    
    // Insert default settings if not exist
    const defaultSettings = [
      ['font_family', 'Inter, system-ui, -apple-system, sans-serif'],
      ['title_font_size', '48'],
      ['desc_font_size', '24'],
      ['slide_interval_ms', '8000'],
      ['logo_url', '/assets/logo-sample.png']
    ];
    
    for (const [key, value] of defaultSettings) {
      await db.query(
        `INSERT INTO settings (key, value) VALUES ($1, $2) 
         ON CONFLICT (key) DO NOTHING`,
        [key, value]
      );
    }
    console.log('✓ Default settings configured');
    
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Start server
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`
╔════════════════════════════════════════════════════╗
║   RSU Islam Group Slideshow Server                ║
╠════════════════════════════════════════════════════╣
║   Server running on: http://localhost:${PORT}       ║
║   Admin Panel: http://localhost:${PORT}/admin.html  ║
║   TV Slideshow: http://localhost:${PORT}/index.html ║
╚════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await db.pool.end();
  process.exit(0);
});

startServer();
