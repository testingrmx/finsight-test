import crypto from 'crypto';
import User   from '../models/User.js';
import Tx     from '../models/Tx.js';
import { makeToken } from '../utils/jwt.js';
import { sendOtp, sendResetEmail } from '../utils/mailer.js';
import { updateSalaryTxs, ensureSalaryTxs, nowYM, deleteSalaryForMonth } from '../utils/salary.js';

const wrap = fn => (req, res, next) => fn(req, res).catch(next);

// Safe email sender — logs the error but NEVER crashes the request with a 500
const safeSendOtp = async (to, name, code, mode) => {
  try {
    await sendOtp(to, name, code, mode);
  } catch (e) {
    console.error('[MAIL ERROR] Failed to send OTP to', to, ':', e.message);
    // Still throw so the caller knows — but with a user-friendly message
    throw new Error('Failed to send verification email. Please try again in a moment.');
  }
};

const safeSendReset = async (to, name, token) => {
  try {
    await sendResetEmail(to, name, token);
  } catch (e) {
    console.error('[MAIL ERROR] Failed to send reset email to', to, ':', e.message);
  }
  // Reset email failure is silent — we don't want to reveal if email exists
};

const safeU = u => ({
  id:            u._id,
  name:          u.name,
  email:         u.email,
  phone:         u.phone || null,
  monthlyIncome: u.monthlyIncome || null,
  salaryPaused:  u.salaryPaused  || false,
  avatar:        u.avatar || null,
  createdAt:     u.createdAt,
});

export const signup = wrap(async (req, res) => {
  const { name, email, password, agreed } = req.body;
  if (!name?.trim() || name.trim().length < 2)
    return res.status(400).json({ error: 'Name must be at least 2 characters.' });
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return res.status(400).json({ error: 'Valid email is required.' });
  if (!password || password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  if (!agreed)
    return res.status(400).json({ error: 'Please agree to the Terms.' });

  const clean = email.toLowerCase().trim();
  const existing = await User.findOne({ email: clean });
  if (existing?.isVerified)
    return res.status(409).json({ error: 'Email already registered. Please sign in.' });
  if (existing) await User.deleteOne({ _id: existing._id });

  const u = new User({ name: name.trim(), email: clean, password });
  const code = u.makeOtp('signup');
  await u.save();
  await safeSendOtp(clean, u.name, code, 'signup');
  res.status(201).json({ ok: true });
});

export const verifySignup = wrap(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and code are required.' });
  const u = await User.findOne({ email: email.toLowerCase().trim() })
    .select('+otp +otpExpiry +otpPurpose');
  if (!u) return res.status(404).json({ error: 'Account not found. Please sign up again.' });
  const err = u.checkOtp(otp, 'signup');
  if (err) return res.status(400).json({ error: err });
  u.isVerified = true;
  u.clearOtp();
  await u.save();
  const fullUser = await User.findById(u._id);
  res.json({ token: makeToken(fullUser._id), user: safeU(fullUser) });
});

export const loginStep1 = wrap(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  const u = await User.findOne({ email: email.toLowerCase().trim() })
    .select('+password +failedLogins +lockUntil');
  if (!u) return res.status(401).json({ error: 'Invalid email or password.' });
  if (u.lockUntil && u.lockUntil > new Date()) {
    const mins = Math.ceil((u.lockUntil - Date.now()) / 60000);
    return res.status(423).json({ error: `Account locked. Try again in ${mins} minute(s).` });
  }
  const ok = await u.checkPw(password);
  if (!ok) {
    const fails = (u.failedLogins || 0) + 1;
    const updates = { failedLogins: fails };
    if (fails >= 5) updates.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
    await User.updateOne({ _id: u._id }, updates);
    if (fails >= 5) return res.status(423).json({ error: 'Too many attempts. Account locked for 30 minutes.' });
    return res.status(401).json({ error: `Invalid email or password. ${5 - fails} attempt(s) left.` });
  }
  if (!u.isVerified) return res.status(403).json({ error: 'Please verify your email first.' });
  const code = u.makeOtp('login');
  u.failedLogins = 0; u.lockUntil = null;
  await u.save();
  await safeSendOtp(u.email, u.name, code, 'login');
  res.json({ ok: true });
});

export const loginStep2 = wrap(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and code are required.' });
  const u = await User.findOne({ email: email.toLowerCase().trim() })
    .select('+otp +otpExpiry +otpPurpose');
  if (!u) return res.status(404).json({ error: 'Account not found.' });
  const err = u.checkOtp(otp, 'login');
  if (err) return res.status(400).json({ error: err });
  u.clearOtp();
  await u.save();
  const fullUser = await User.findById(u._id);
  if (!fullUser) return res.status(404).json({ error: 'Account not found.' });
  if (fullUser.monthlyIncome && !fullUser.salaryPaused) {
    await ensureSalaryTxs(fullUser, [nowYM()]);
  }
  res.json({ token: makeToken(fullUser._id), user: safeU(fullUser) });
});

export const resend = wrap(async (req, res) => {
  const { email, purpose } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });
  const u = await User.findOne({ email: email.toLowerCase().trim() });
  if (!u) return res.status(404).json({ error: 'Account not found.' });
  const code = u.makeOtp(purpose || 'signup');
  await u.save();
  await safeSendOtp(u.email, u.name, code, purpose || 'signup');
  res.json({ ok: true });
});

export const forgotPassword = wrap(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });
  const u = await User.findOne({ email: email.toLowerCase().trim() });
  if (u) {
    const token = crypto.randomBytes(32).toString('hex');
    u.resetToken  = token;
    u.resetExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await u.save();
    await safeSendReset(u.email, u.name, token);
  }
  res.json({ ok: true });
});

export const resetPassword = wrap(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password || password.length < 8)
    return res.status(400).json({ error: 'Valid token and password (min 8 chars) required.' });
  const u = await User.findOne({ resetToken: token }).select('+resetToken +resetExpiry');
  if (!u || !u.resetExpiry || u.resetExpiry < new Date())
    return res.status(400).json({ error: 'Reset link is expired or invalid.' });
  u.password    = password;
  u.resetToken  = undefined;
  u.resetExpiry = undefined;
  u.failedLogins = 0; u.lockUntil = null;
  await u.save();
  res.json({ ok: true });
});

export const getMe = wrap(async (req, res) => res.json({ user: safeU(req.user) }));

export const updateProfile = wrap(async (req, res) => {
  const upd = {};
  if (req.body.name !== undefined) {
    const n = req.body.name?.trim();
    if (!n || n.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters.' });
    upd.name = n;
  }
  if (req.body.avatar !== undefined) upd.avatar = req.body.avatar;
  if (req.body.phone  !== undefined) upd.phone  = req.body.phone ? String(req.body.phone).trim().slice(0,20) : null;

  const salaryChanged = req.body.monthlyIncome !== undefined;
  const pausedChanged = req.body.salaryPaused  !== undefined;

  if (salaryChanged) {
    const v = req.body.monthlyIncome;
    upd.monthlyIncome = (v === null || v === '' || +v <= 0) ? null : +v;
  }
  if (pausedChanged) {
    upd.salaryPaused = !!req.body.salaryPaused;
  }

  const u = await User.findByIdAndUpdate(req.user._id, upd, { new: true, runValidators: true });
  if (!u) return res.status(404).json({ error: 'User not found.' });

  if (salaryChanged || pausedChanged) {
    await updateSalaryTxs(u, u.monthlyIncome, u.salaryPaused);
  }

  res.json({ user: safeU(u) });
});

export const deleteSalaryMonth = wrap(async (req, res) => {
  const { ym } = req.params;
  if (!/^\d{4}-\d{2}$/.test(ym)) return res.status(400).json({ error: 'Invalid month format.' });
  await deleteSalaryForMonth(req.user._id, ym);
  res.json({ ok: true });
});

export const changePassword = wrap(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 8)
    return res.status(400).json({ error: 'Current password and new password (min 8 chars) required.' });
  const u = await User.findById(req.user._id).select('+password');
  if (!(await u.checkPw(currentPassword)))
    return res.status(401).json({ error: 'Current password is incorrect.' });
  u.password = newPassword;
  await u.save();
  res.json({ ok: true });
});

export const deleteAccount = wrap(async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required.' });
  const u = await User.findById(req.user._id).select('+password');
  if (!(await u.checkPw(password))) return res.status(401).json({ error: 'Incorrect password.' });
  await Promise.all([Tx.deleteMany({ userId: u._id }), User.deleteOne({ _id: u._id })]);
  res.json({ ok: true });
});