const express  = require('express');
const Sale     = require('../models/Sale');
const Product  = require('../models/Product');
const User     = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const router   = express.Router();

// GET /api/reports/dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd   = new Date(); todayEnd.setHours(23,59,59,999);
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);

    // Today sales
    const todayAgg = await Sale.aggregate([
      { $match: { created_at: { $gte: todayStart, $lte: todayEnd }, status: 'completed' } },
      { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$total' }, tax: { $sum: '$tax_amount' } } }
    ]);
    const today = todayAgg[0] || { count: 0, revenue: 0, tax: 0 };

    // Month sales
    const monthAgg = await Sale.aggregate([
      { $match: { created_at: { $gte: monthStart }, status: 'completed' } },
      { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$total' } } }
    ]);
    const month = monthAgg[0] || { count: 0, revenue: 0 };

    // Product counts
    const totalProducts = await Product.countDocuments({ active: true });
    const allProducts   = await Product.find({ active: true }, 'stock_qty min_stock');
    const lowStock      = allProducts.filter(p => p.stock_qty <= p.min_stock && p.stock_qty > 0).length;
    const outOfStock    = allProducts.filter(p => p.stock_qty <= 0).length;

    // Last 7 days
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); sevenDaysAgo.setHours(0,0,0,0);
    const last7Days = await Sale.aggregate([
      { $match: { created_at: { $gte: sevenDaysAgo }, status: 'completed' } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
        transactions: { $sum: 1 }, revenue: { $sum: '$total' }
      }},
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', transactions: 1, revenue: 1, _id: 0 } }
    ]);

    // Top products today
    const topProducts = await Sale.aggregate([
      { $match: { created_at: { $gte: todayStart, $lte: todayEnd }, status: 'completed' } },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.product_id',
        name:     { $first: '$items.product_name' },
        barcode:  { $first: '$items.barcode' },
        qty_sold: { $sum: '$items.quantity' },
        revenue:  { $sum: '$items.line_total' },
      }},
      { $sort: { qty_sold: -1 } },
      { $limit: 10 }
    ]);

    // Recent sales
    const recentSales = await Sale.find({ status: 'completed' })
      .populate('cashier_id', 'name')
      .sort({ created_at: -1 })
      .limit(5)
      .select('sale_number total payment_method created_at cashier_id');

    res.json({
      today:       { count: today.count,  revenue: today.revenue,  tax: today.tax },
      month:       { count: month.count,  revenue: month.revenue },
      products:    { count: totalProducts },
      lowStock:    { count: lowStock },
      outOfStock:  { count: outOfStock },
      last7Days,
      topProducts,
      recentSales: recentSales.map(s => ({
        id: s._id, sale_number: s.sale_number, total: s.total,
        payment_method: s.payment_method, created_at: s.created_at,
        cashier_name: s.cashier_id?.name,
      })),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/reports/sales
router.get('/sales', authenticateToken, async (req, res) => {
  try {
    const from    = req.query.from || new Date(Date.now() - 30*86400000).toISOString().slice(0,10);
    const to      = req.query.to   || new Date().toISOString().slice(0,10);
    const fromDate = new Date(from); fromDate.setHours(0,0,0,0);
    const toDate   = new Date(to);   toDate.setHours(23,59,59,999);

    const sales = await Sale.aggregate([
      { $match: { created_at: { $gte: fromDate, $lte: toDate }, status: 'completed' } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
        transactions: { $sum: 1 },
        revenue:      { $sum: '$total' },
        discounts:    { $sum: '$discount_amount' },
        tax:          { $sum: '$tax_amount' },
      }},
      { $sort: { _id: 1 } },
      { $project: { period: '$_id', transactions: 1, revenue: 1, discounts: 1, tax: 1, _id: 0 } }
    ]);

    const summaryArr = await Sale.aggregate([
      { $match: { created_at: { $gte: fromDate, $lte: toDate }, status: 'completed' } },
      { $group: {
        _id: null,
        transactions: { $sum: 1 },
        revenue:      { $sum: '$total' },
        discounts:    { $sum: '$discount_amount' },
        tax:          { $sum: '$tax_amount' },
        avg_sale:     { $avg: '$total' },
      }}
    ]);
    const summary = summaryArr[0] || { transactions:0, revenue:0, discounts:0, tax:0, avg_sale:0 };
    res.json({ sales, summary, from, to });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/reports/products
router.get('/products', authenticateToken, async (req, res) => {
  try {
    const from    = req.query.from || new Date(Date.now() - 30*86400000).toISOString().slice(0,10);
    const to      = req.query.to   || new Date().toISOString().slice(0,10);
    const limit   = parseInt(req.query.limit) || 20;
    const fromDate = new Date(from); fromDate.setHours(0,0,0,0);
    const toDate   = new Date(to);   toDate.setHours(23,59,59,999);

    const products = await Sale.aggregate([
      { $match: { created_at: { $gte: fromDate, $lte: toDate }, status: 'completed' } },
      { $unwind: '$items' },
      { $group: {
        _id:      '$items.product_id',
        name:     { $first: '$items.product_name' },
        barcode:  { $first: '$items.barcode' },
        qty_sold: { $sum: '$items.quantity' },
        revenue:  { $sum: '$items.line_total' },
      }},
      { $sort: { qty_sold: -1 } },
      { $limit: limit },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'prod' } },
      { $unwind: { path: '$prod', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'categories', localField: 'prod.category_id', foreignField: '_id', as: 'cat' } },
      { $project: {
        id: '$_id', name: 1, barcode: 1, qty_sold: 1, revenue: 1,
        cost:     { $multiply: ['$qty_sold', { $ifNull: ['$prod.cost_price', 0] }] },
        profit:   { $subtract: ['$revenue', { $multiply: ['$qty_sold', { $ifNull: ['$prod.cost_price', 0] }] }] },
        category: { $arrayElemAt: ['$cat.name', 0] },
      }}
    ]);
    res.json(products);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/reports/stock
router.get('/stock', authenticateToken, async (req, res) => {
  try {
    const products = await Product.find({ active: true })
      .populate('category_id', 'name')
      .sort({ stock_qty: 1 });

    const flat = products.map(p => ({
      ...p.toObject(), id: p._id,
      category_name: p.category_id?.name,
      stock_value: p.stock_qty * p.cost_price,
    }));

    const summary = {
      total_products: flat.length,
      total_value:    flat.reduce((s, p) => s + p.stock_value, 0),
      low_stock:      flat.filter(p => p.stock_qty <= p.min_stock && p.stock_qty > 0).length,
      out_of_stock:   flat.filter(p => p.stock_qty <= 0).length,
    };
    res.json({ products: flat, summary });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/reports/cashier
router.get('/cashier', authenticateToken, async (req, res) => {
  try {
    const from    = req.query.from || new Date(Date.now() - 30*86400000).toISOString().slice(0,10);
    const to      = req.query.to   || new Date().toISOString().slice(0,10);
    const fromDate = new Date(from); fromDate.setHours(0,0,0,0);
    const toDate   = new Date(to);   toDate.setHours(23,59,59,999);

    const cashiers = await Sale.aggregate([
      { $match: { created_at: { $gte: fromDate, $lte: toDate }, status: 'completed' } },
      { $group: {
        _id:          '$cashier_id',
        transactions: { $sum: 1 },
        revenue:      { $sum: '$total' },
        avg_sale:     { $avg: '$total' },
      }},
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { id: '$_id', name: { $ifNull: ['$user.name', 'Unknown'] }, transactions: 1, revenue: 1, avg_sale: 1 } },
      { $sort: { revenue: -1 } }
    ]);
    res.json(cashiers);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
