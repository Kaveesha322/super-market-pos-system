const express  = require('express');
const Supplier = require('../models/Supplier');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router   = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const suppliers = await Supplier.find({ active: true }).sort({ name: 1 });
    res.json(suppliers.map(s => ({ ...s.toObject(), id: s._id })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, requireRole('admin','manager'), async (req, res) => {
  try {
    const s = await Supplier.create(req.body);
    res.status(201).json({ ...s.toObject(), id: s._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, requireRole('admin','manager'), async (req, res) => {
  try {
    const s = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ ...s.toObject(), id: s._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    await Supplier.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ message: 'Supplier deactivated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
