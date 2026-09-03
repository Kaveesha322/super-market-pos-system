const express  = require('express');
const Product  = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router   = express.Router();

// GET /api/products
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, category, low_stock, active = 'true' } = req.query;
    const filter = {};
    if (active !== 'all') filter.active = true;
    if (category)  filter.category_id = category;
    if (search) {
      filter.$or = [
        { name:    { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { name_si: { $regex: search, $options: 'i' } },
      ];
    }

    let query = Product.find(filter)
      .populate('category_id', 'name color icon')
      .populate('supplier_id', 'name')
      .sort({ name: 1 });

    if (low_stock === 'true') {
      // post-filter: stock_qty <= min_stock
      const all = await query;
      return res.json(all.filter(p => p.stock_qty <= p.min_stock));
    }

    const products = await query;
    // Flatten populated fields for frontend compatibility
    const flat = products.map(flatProduct);
    res.json(flat);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/products/barcode/:code
router.get('/barcode/:code', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findOne({ barcode: req.params.code, active: true })
      .populate('category_id', 'name color icon');
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(flatProduct(product));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/products/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category_id', 'name color icon')
      .populate('supplier_id', 'name');
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(flatProduct(product));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/products
router.post('/', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { barcode, name, name_si, description, category_id, supplier_id, unit,
      cost_price, selling_price, stock_qty, min_stock, max_stock, tax_rate, discount_pct } = req.body;
    if (!barcode || !name || !selling_price)
      return res.status(400).json({ error: 'barcode, name and selling_price are required' });

    const product = await Product.create({
      barcode, name, name_si, description,
      category_id: category_id || null,
      supplier_id: supplier_id || null,
      unit: unit || 'pcs',
      cost_price: cost_price || 0,
      selling_price, stock_qty: stock_qty || 0,
      min_stock: min_stock || 5,
      max_stock: max_stock || 1000,
      tax_rate: tax_rate || 0,
      discount_pct: discount_pct || 0,
    });

    if (stock_qty > 0) {
      await StockMovement.create({
        product_id: product._id, type: 'in', quantity: stock_qty,
        quantity_before: 0, quantity_after: stock_qty,
        note: 'Initial stock', user_id: req.user.id,
      });
    }

    res.status(201).json(flatProduct(await product.populate('category_id supplier_id')));
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Barcode already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id
router.put('/:id', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const existing = await Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    const { stock_qty } = req.body;
    if (stock_qty !== undefined && Number(stock_qty) !== existing.stock_qty) {
      const diff = Number(stock_qty) - existing.stock_qty;
      await StockMovement.create({
        product_id: existing._id, type: 'adjustment', quantity: diff,
        quantity_before: existing.stock_qty, quantity_after: Number(stock_qty),
        note: 'Manual adjustment', user_id: req.user.id,
      });
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('category_id', 'name color icon')
      .populate('supplier_id', 'name');
    res.json(flatProduct(updated));
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Barcode already exists' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id (soft delete)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ message: 'Product deactivated successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/products/:id/stock
router.post('/:id/stock', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { quantity, type = 'in', note } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const newQty = type === 'in' ? product.stock_qty + Number(quantity) : product.stock_qty - Number(quantity);
    product.stock_qty = newQty;
    await product.save();
    await StockMovement.create({
      product_id: product._id, type, quantity: Number(quantity),
      quantity_before: product.stock_qty - (type === 'in' ? quantity : -quantity),
      quantity_after: newQty, note, user_id: req.user.id,
    });
    res.json({ stock_qty: newQty });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Helper: flatten populated Mongoose doc for frontend
function flatProduct(p) {
  const obj = p.toObject ? p.toObject({ virtuals: true }) : p;
  return {
    ...obj,
    id: obj._id,
    category_name:  obj.category_id?.name  || null,
    category_color: obj.category_id?.color || null,
    category_icon:  obj.category_id?.icon  || null,
    supplier_name:  obj.supplier_id?.name  || null,
    category_id:    obj.category_id?._id   || obj.category_id || null,
    supplier_id:    obj.supplier_id?._id   || obj.supplier_id || null,
  };
}

module.exports = router;
