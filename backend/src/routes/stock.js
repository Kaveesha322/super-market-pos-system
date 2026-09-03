const express       = require('express');
const StockMovement = require('../models/StockMovement');
const { authenticateToken } = require('../middleware/auth');
const router        = express.Router();

router.get('/movements', authenticateToken, async (req, res) => {
  try {
    const { product_id, limit = 50 } = req.query;
    const filter = {};
    if (product_id) filter.product_id = product_id;

    const movements = await StockMovement.find(filter)
      .populate('product_id', 'name barcode')
      .populate('user_id',    'name')
      .sort({ created_at: -1 })
      .limit(Number(limit));

    const flat = movements.map(m => ({
      ...m.toObject(), id: m._id,
      product_name: m.product_id?.name,
      barcode:      m.product_id?.barcode,
      user_name:    m.user_id?.name,
    }));
    res.json(flat);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
