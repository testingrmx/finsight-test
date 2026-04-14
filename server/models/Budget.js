import mongoose from 'mongoose';
const s = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category:        { type: String, required: true, trim: true },
  allocatedAmount: { type: Number, required: true, min: 0 },
  month:           { type: String, required: true, match: /^\d{4}-\d{2}$/ },
}, { timestamps: true });
s.index({ userId: 1, month: 1, category: 1 }, { unique: true });
export default mongoose.model('Budget', s);
