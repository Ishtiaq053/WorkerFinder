/**
 * ──────────────────────────────────────────────────────────────
 *  WorkerFinder — Labour Marketplace API
 *  Main server entry point
 * ──────────────────────────────────────────────────────────────
 */

const express = require('express');
const cors = require('cors');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import route modules
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const profileRoutes = require('./routes/profileRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const savedJobsRoutes = require('./routes/savedJobsRoutes');
const logsRoutes = require('./routes/logsRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const PORT = 3000;

// ─── Global Middleware ───────────────────────────────────────
app.use(cors());
app.use(express.json());

// Simple request logger (helpful for debugging)
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// ─── API Routes ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/saved-jobs', savedJobsRoutes);
app.use('/api/admin/logs', logsRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'WorkerFinder API is running',
    timestamp: new Date().toISOString()
  });
});

// ─── Error Handling ──────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n══════════════════════════════════════════════');
  console.log('  🔨 WorkerFinder API Server');
  console.log('══════════════════════════════════════════════');
  console.log(`  🚀 Running on:  http://localhost:${PORT}`);
  console.log(`  📋 Health:      http://localhost:${PORT}/api/health`);
  console.log('──────────────────────────────────────────────');
  console.log('  👤 Admin Login:');
  console.log('     Email:    admin@workerfinder.com');
  console.log('     Password: admin123');
  console.log('══════════════════════════════════════════════\n');
});
