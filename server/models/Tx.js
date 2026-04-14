import mongoose from 'mongoose';

const s = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  desc:   { type: String, required: true, trim: true, maxlength: 300 },
  amount: { type: Number, required: true, min: 0.01 },
  cat:    { type: String, default: 'Other' },
  type:   { type: String, enum: ['credit', 'debit'], required: true },
  date:   { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  notes:  { type: String, trim: true, maxlength: 500, default: '' },
  src:    { type: String, enum: ['manual', 'import', 'salary'], default: 'manual' },
}, { timestamps: true });

s.index({ userId: 1, date: -1 });
s.index({ userId: 1, type: 1 });

export default mongoose.model('Tx', s);
