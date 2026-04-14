import Goal from '../models/Goal.js';
const wrap = fn => (req, res, next) => fn(req, res).catch(next);

const status = g => {
  if (g.currentAmount >= g.targetAmount) return 'completed';
  if (new Date().toISOString().split('T')[0] > g.targetDate) return 'overdue';
  return 'in_progress';
};

const fmt = g => ({
  id: g._id, name: g.name, targetAmount: g.targetAmount, currentAmount: g.currentAmount,
  remainingAmount: Math.max(0, g.targetAmount - g.currentAmount),
  progressPercent: g.targetAmount > 0 ? +Math.min(100, g.currentAmount / g.targetAmount * 100).toFixed(2) : 0,
  targetDate: g.targetDate, category: g.category, description: g.description,
  status: status(g), createdAt: g.createdAt,
});

export const list = wrap(async (req, res) => {
  const goals = await Goal.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json(goals.map(fmt));
});

export const create = wrap(async (req, res) => {
  const { name, targetAmount, currentAmount, targetDate, category, description } = req.body;
  if (!name || !targetAmount || !targetDate || !category)
    return res.status(400).json({ error: 'name, targetAmount, targetDate, category are required.' });
  const g = await Goal.create({ userId: req.user._id, name, targetAmount: +targetAmount, currentAmount: +(currentAmount || 0), targetDate, category, description });
  res.status(201).json(fmt(g));
});

export const update = wrap(async (req, res) => {
  const { name, targetAmount, currentAmount, targetDate, category, description } = req.body;
  const g = await Goal.findOneAndUpdate({ _id: req.params.id, userId: req.user._id },
    { name, targetAmount: +targetAmount, currentAmount: +currentAmount, targetDate, category, description },
    { new: true, runValidators: true });
  if (!g) return res.status(404).json({ error: 'Goal not found.' });
  res.json(fmt(g));
});

export const contribute = wrap(async (req, res) => {
  const { amount } = req.body;
  if (!amount || +amount <= 0) return res.status(400).json({ error: 'Positive amount required.' });
  const g = await Goal.findOneAndUpdate({ _id: req.params.id, userId: req.user._id },
    { $inc: { currentAmount: +amount } }, { new: true });
  if (!g) return res.status(404).json({ error: 'Goal not found.' });
  res.json(fmt(g));
});

export const remove = wrap(async (req, res) => {
  const g = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!g) return res.status(404).json({ error: 'Goal not found.' });
  res.json({ ok: true });
});
