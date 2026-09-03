const express  = require('express');
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router   = express.Router();

router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password_hash').sort({ name: 1 });
    res.json(users.map(u => ({ ...u.toObject(), id: u._id })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ error: 'All fields required' });
    const hash = bcrypt.hashSync(password, 10);
    const user = await User.create({ name, email: email.toLowerCase(), password_hash: hash, role });
    res.status(201).json({ ...user.toObject(), id: user._id });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, role, active, password } = req.body;
    const update = { name, email: email?.toLowerCase(), role, active };
    if (password) update.password_hash = bcrypt.hashSync(password, 10);
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password_hash');
    res.json({ ...user.toObject(), id: user._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ message: 'User deactivated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
