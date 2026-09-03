const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  product_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type:            { type: String, enum: ['in','out','adjustment','sale','return'], required: true },
  quantity:        { type: Number, required: true },
  quantity_before: { type: Number },
  quantity_after:  { type: Number },
  reference:       { type: String },
  note:            { type: String },
  user_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
