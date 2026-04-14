import mongoose from 'mongoose';
const TYPES = ['mutual_fund','stocks','fd','ppf','nps','gold','real_estate','crypto','other'];
const s = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:           { type: String, required: true, trim: true, maxlength: 200 },
  type:           { type: String, enum: TYPES, required: true },
  investedAmount: { type: Number, required: true, min: 0 },
  currentValue:   { type: Number, required: true, min: 0 },
  units:          { type: Number },
  purchaseDate:   { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  notes:          { type: String, trim: true, maxlength: 500 },
}, { timestamps: true });
export default mongoose.model('Investment', s);
