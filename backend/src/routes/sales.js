const express  = require('express');
const Sale     = require('../models/Sale');
const Product  = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router   = express.Router();

// POST /api/sales
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { items, discount_amount = 0, payment_method = 'cash', amount_paid, customer_name, notes } = req.body;
    if (!items || items.length === 0)
      return res.status(400).json({ error: 'No items in sale' });

    let subtotal = 0, tax_amount = 0;
    const saleItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (!product) return res.status(400).json({ error: `Product not found: ${item.product_id}` });
      if (product.stock_qty < item.quantity)
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });

      const line_sub      = item.unit_price * item.quantity;
      const line_disc_amt = line_sub * (item.discount_pct || 0) / 100;
      const line_after    = line_sub - line_disc_amt;
      const line_tax      = line_after * (product.tax_rate || 0) / 100;
      const line_total    = line_after + line_tax;

      subtotal    += line_sub;
      tax_amount  += line_tax;

      saleItems.push({
        product_id:      product._id,
        product_name:    product.name,
        barcode:         product.barcode,
        quantity:        item.quantity,
        unit_price:      item.unit_price,
        discount_pct:    item.discount_pct || 0,
        discount_amount: line_disc_amt,
        tax_amount:      line_tax,
        line_total,
      });
    }

    const total        = subtotal - Number(discount_amount) + tax_amount;
    const change_amount = Math.max(0, (Number(amount_paid) || 0) - total);

    // Generate sale number: INV-YYYYMMDD-0001
    const today    = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix   = `INV-${today}-`;
    const lastSale = await Sale.findOne({ sale_number: { $regex: `^${prefix}` } }).sort({ sale_number: -1 });
    let seq = 1;
    if (lastSale) seq = parseInt(lastSale.sale_number.split('-')[2]) + 1;
    const sale_number = `${prefix}${String(seq).padStart(4, '0')}`;

    const sale = await Sale.create({
      sale_number, cashier_id: req.user.id, customer_name,
      items: saleItems, subtotal, discount_amount: Number(discount_amount),
      tax_amount, total, amount_paid: Number(amount_paid) || total,
      change_amount, payment_method, notes,
    });

    // Deduct stock & record movements
    for (const item of saleItems) {
      const product = await Product.findById(item.product_id);
      const newQty  = product.stock_qty - item.quantity;
      await Product.findByIdAndUpdate(item.product_id, { stock_qty: newQty });
      await StockMovement.create({
        product_id: item.product_id, type: 'sale', quantity: item.quantity,
        quantity_before: product.stock_qty, quantity_after: newQty,
        reference: sale_number, note: 'Sale', user_id: req.user.id,
      });
    }

    const populated = await Sale.findById(sale._id).populate('cashier_id', 'name');
    res.status(201).json(flatSale(populated));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/sales
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { date, cashier_id, limit = 50, offset = 0 } = req.query;
    const filter = {};
    if (date) {
      const start = new Date(date); start.setHours(0,0,0,0);
      const end   = new Date(date); end.setHours(23,59,59,999);
      filter.created_at = { $gte: start, $lte: end };
    }
    if (cashier_id) filter.cashier_id = cashier_id;

    const sales = await Sale.find(filter)
      .populate('cashier_id', 'name')
      .sort({ created_at: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    res.json(sales.map(flatSale));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/sales/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('cashier_id', 'name');
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    res.json(flatSale(sale));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/sales/:id/void
router.post('/:id/void', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    if (sale.status !== 'completed') return res.status(400).json({ error: 'Sale cannot be voided' });

    for (const item of sale.items) {
      const product = await Product.findById(item.product_id);
      if (!product) continue;
      const newQty = product.stock_qty + item.quantity;
      await Product.findByIdAndUpdate(item.product_id, { stock_qty: newQty });
      await StockMovement.create({
        product_id: item.product_id, type: 'return', quantity: item.quantity,
        quantity_before: product.stock_qty, quantity_after: newQty,
        reference: sale.sale_number, note: 'Sale voided', user_id: req.user.id,
      });
    }

    sale.status = 'void';
    await sale.save();
    res.json({ message: 'Sale voided successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

function flatSale(s) {
  const obj = s.toObject ? s.toObject() : s;
  return { ...obj, id: obj._id, cashier_name: obj.cashier_id?.name || 'Unknown' };
}

module.exports = router;
