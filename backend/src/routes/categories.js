const express  = require('express');
const Category = require('../models/Category');
const Product  = require('../models/Product');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router   = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const cats = await Category.find().sort({ name: 1 });
    const result = await Promise.all(cats.map(async c => {
      const count = await Product.countDocuments({ category_id: c._id, active: true });
      return { ...c.toObject(), id: c._id, product_count: count };
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, requireRole('admin','manager'), async (req, res) => {
  try {
    const { name, color, icon } = req.body;
    const cat = await Category.create({ name, color: color||'#3B82F6', icon: icon||'📦' });
    res.status(201).json({ ...cat.toObject(), id: cat._id });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Category already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, requireRole('admin','manager'), async (req, res) => {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ ...cat.toObject(), id: cat._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
