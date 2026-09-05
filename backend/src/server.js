require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const { connectDB } = require('./db/mongoose');

const authRoutes      = require('./routes/auth');
const productRoutes   = require('./routes/products');
const salesRoutes     = require('./routes/sales');
const reportsRoutes   = require('./routes/reports');
const usersRoutes     = require('./routes/users');
const settingsRoutes  = require('./routes/settings');
const categoriesRoutes= require('./routes/categories');
const suppliersRoutes = require('./routes/suppliers');
const stockRoutes     = require('./routes/stock');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── DB connect middleware (serverless-safe lazy connect) ────────────────────
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(503).json({ error: 'Database unavailable', message: err.message });
  }
});

// ── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/sales',      salesRoutes);
app.use('/api/reports',    reportsRoutes);
app.use('/api/users',      usersRoutes);
app.use('/api/settings',   settingsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/suppliers',  suppliersRoutes);
app.use('/api/stock',      stockRoutes);

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', db: 'mongodb', message: 'SuperMarket POS API running', timestamp: new Date() })
);

// ── Error handler ───────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// ── Local dev server (not on Vercel) ────────────────────────────────────────
if (!process.env.VERCEL) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`\n🚀 Super Lanka Mart POS Server running on port ${PORT}`);
      console.log(`🍃 Database: MongoDB`);
      console.log(`📊 API: http://localhost:${PORT}/api`);
      console.log(`🏪 Store: ${process.env.STORE_NAME || 'Super Lanka Mart'}\n`);
    });
  });
}

module.exports = app;
