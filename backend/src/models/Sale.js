const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  product_name:    { type: String, required: true },
  barcode:         { type: String },
  quantity:        { type: Number, required: true, min: 0.01 },
  unit_price:      { type: Number, required: true, min: 0 },
  discount_pct:    { type: Number, default: 0 },
  discount_amount: { type: Number, default: 0 },
  tax_amount:      { type: Number, default: 0 },
  line_total:      { type: Number, required: true },
}, { _id: true });

const saleSchema = new mongoose.Schema({
  sale_number:     { type: String, required: true, unique: true },
  cashier_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customer_name:   { type: String, trim: true },
  items:           [saleItemSchema],
  subtotal:        { type: Number, default: 0 },
  discount_amount: { type: Number, default: 0 },
  tax_amount:      { type: Number, default: 0 },
  total:           { type: Number, required: true },
  amount_paid:     { type: Number, default: 0 },
  change_amount:   { type: Number, default: 0 },
  payment_method:  { type: String, enum: ['cash','card','qr','mixed'], default: 'cash' },
  status:          { type: String, enum: ['completed','refunded','void'], default: 'completed' },
  notes:           { type: String },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Sale', saleSchema);
