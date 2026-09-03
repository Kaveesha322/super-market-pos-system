const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  barcode:       { type: String, required: true, unique: true, trim: true },
  name:          { type: String, required: true, trim: true },
  name_si:       { type: String, trim: true },
  description:   { type: String, trim: true },
  category_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  supplier_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', default: null },
  unit:          { type: String, default: 'pcs' },
  cost_price:    { type: Number, default: 0, min: 0 },
  selling_price: { type: Number, required: true, min: 0 },
  stock_qty:     { type: Number, default: 0 },
  min_stock:     { type: Number, default: 5 },
  max_stock:     { type: Number, default: 1000 },
  tax_rate:      { type: Number, default: 0, min: 0, max: 100 },
  discount_pct:  { type: Number, default: 0, min: 0, max: 100 },
  image_url:     { type: String },
  active:        { type: Boolean, default: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Virtual: category_name, category_color, category_icon (populated)
productSchema.virtual('category_name').get(function () {
  return this.category_id?.name;
});
productSchema.virtual('category_color').get(function () {
  return this.category_id?.color;
});
productSchema.virtual('category_icon').get(function () {
  return this.category_id?.icon;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
