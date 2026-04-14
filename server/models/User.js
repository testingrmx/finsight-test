import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const s = new mongoose.Schema({
  name:          { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:         { type: String, trim: true, maxlength: 20, default: null },
  password:      { type: String, required: true, minlength: 6, select: false },
  isVerified:    { type: Boolean, default: false },
  otp:           { type: String,  select: false },
  otpExpiry:     { type: Date,    select: false },
  otpPurpose:    { type: String,  select: false },
  failedLogins:  { type: Number,  default: 0 },
  lockUntil:     { type: Date,    default: null },
  monthlyIncome: { type: Number,  default: null, min: 0 },
  salaryPaused:  { type: Boolean, default: false },
  avatar:        { type: String,  default: null },
  resetToken:    { type: String,  select: false },
  resetExpiry:   { type: Date,    select: false },
}, { timestamps: true });

s.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

s.methods.checkPw = function (pw) { return bcrypt.compare(pw, this.password); };

s.methods.makeOtp = function (purpose) {
  this.otp        = Math.floor(100000 + Math.random() * 900000).toString();
  this.otpExpiry  = new Date(Date.now() + 10 * 60 * 1000);
  this.otpPurpose = purpose;
  return this.otp;
};

s.methods.checkOtp = function (code, purpose) {
  if (!this.otp)                     return 'No code found. Request a new one.';
  if (this.otpPurpose !== purpose)   return 'Wrong code type.';
  if (String(code).trim() !== this.otp) return 'Invalid code.';
  if (new Date() > this.otpExpiry)   return 'Code expired. Request a new one.';
  return null;
};

s.methods.clearOtp = function () {
  this.otp = undefined;
  this.otpExpiry = undefined;
  this.otpPurpose = undefined;
};

s.set('toJSON', {
  transform: (_, r) => {
    delete r.password; delete r.otp; delete r.otpExpiry; delete r.otpPurpose;
    delete r.failedLogins; delete r.lockUntil; delete r.resetToken; delete r.resetExpiry;
    delete r.__v;
    return r;
  }
});

export default mongoose.model('User', s);
