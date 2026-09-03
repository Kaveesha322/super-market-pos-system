const express  = require('express');
const Setting  = require('../models/Setting');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router   = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const settings = await Setting.find();
    const obj = {};
    settings.forEach(s => { obj[s.key] = s.value; });
    res.json(obj);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      await Setting.findOneAndUpdate({ key }, { key, value: String(value) }, { upsert: true });
    }
    const settings = await Setting.find();
    const obj = {};
    settings.forEach(s => { obj[s.key] = s.value; });
    res.json(obj);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
