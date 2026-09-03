const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name:           { type: String, required: true, trim: true },
  contact_person: { type: String, trim: true },
  phone:          { type: String, trim: true },
  email:          { type: String, trim: true },
  address:        { type: String, trim: true },
  active:         { type: Boolean, default: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Supplier', supplierSchema);
