const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name:  { type: String, required: true, unique: true, trim: true },
  color: { type: String, default: '#3B82F6' },
  icon:  { type: String, default: '📦' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Category', categorySchema);
