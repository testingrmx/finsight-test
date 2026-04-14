import Budget from '../models/Budget.js';
import Tx     from '../models/Tx.js';
import mongoose from 'mongoose';

const wrap = fn => (req, res, next) => fn(req, res).catch(next);

const nowYM = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`;
};

const spentInMonth = async (userId, month) => {
  const [y, mo] = month.split('-').map(Number);
  const start = `${month}-01`;
  const lastDay = new Date(y, mo, 0).getDate();
  const end = `${month}-${String(lastDay).padStart(2,'0')}`;
  const rows = await Tx.aggregate([
    { $match: {
      userId: new mongoose.Types.ObjectId(userId),
      type: 'debit',
      date: { $gte: start, $lte: end }
    }},
    { $group: { _id: '$cat', total: { $sum: '$amount' } } },
  ]);
  return Object.fromEntries(rows.map(r => [r._id, r.total]));
};

const fmtBudget = (b, spent) => {
  const s   = spent[b.category] || 0;
  const pct = b.allocatedAmount > 0 ? Math.round(s / b.allocatedAmount * 10000) / 100 : 0;
  let status;
  if (s > b.allocatedAmount)      status = 'exceeded';
  else if (s === b.allocatedAmount) status = 'fully_used';
  else if (pct >= 80)               status = 'warning';
  else                              status = 'on_track';
  return {
    id: b._id,
    category: b.category,
    allocatedAmount: b.allocatedAmount,
    spentAmount: Math.round(s),
    remainingAmount: Math.round(b.allocatedAmount - s),
    percentageUsed: pct,
    month: b.month,
    status,
  };
};

export const list = wrap(async (req, res) => {
  const month  = req.query.month || nowYM();
  const userId = req.user._id;
  const [budgets, spent] = await Promise.all([
    Budget.find({ userId, month }).sort({ category: 1 }),
    spentInMonth(userId, month),
  ]);
  res.json(budgets.map(b => fmtBudget(b, spent)));
});

export const create = wrap(async (req, res) => {
  const { category, allocatedAmount, month } = req.body;
  if (!category || !allocatedAmount || +allocatedAmount <= 0)
    return res.status(400).json({ error: 'category and a positive allocatedAmount are required.' });
  const m = month || nowYM();
  const existing = await Budget.findOne({ userId: req.user._id, category, month: m });
  if (existing)
    return res.status(409).json({ error: `A budget for "${category}" already exists in ${m}.` });
  const b = await Budget.create({ userId: req.user._id, category, allocatedAmount: +allocatedAmount, month: m });
  const spent = await spentInMonth(req.user._id, m);
  res.status(201).json(fmtBudget(b, spent));
});

export const update = wrap(async (req, res) => {
  const { allocatedAmount } = req.body;
  if (!allocatedAmount || +allocatedAmount <= 0)
    return res.status(400).json({ error: 'A positive allocatedAmount is required.' });
  const b = await Budget.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { allocatedAmount: +allocatedAmount },
    { new: true }
  );
  if (!b) return res.status(404).json({ error: 'Budget not found.' });
  const spent = await spentInMonth(req.user._id, b.month);
  res.json(fmtBudget(b, spent));
});

export const remove = wrap(async (req, res) => {
  const b = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!b) return res.status(404).json({ error: 'Budget not found.' });
  res.json({ ok: true });
});
