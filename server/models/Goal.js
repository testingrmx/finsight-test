import mongoose from 'mongoose';
const CATS = ['emergency_fund','home','vehicle','education','vacation','retirement','wedding','other'];
const s = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:          { type: String, required: true, trim: true, maxlength: 200 },
  targetAmount:  { type: Number, required: true, min: 1 },
  currentAmount: { type: Number, default: 0, min: 0 },
  targetDate:    { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  category:      { type: String, enum: CATS, required: true },
  description:   { type: String, trim: true, maxlength: 500 },
}, { timestamps: true });
export default mongoose.model('Goal', s);
