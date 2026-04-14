import Investment from '../models/Investment.js';
const wrap = fn => (req, res, next) => fn(req, res).catch(next);

const fmt = inv => ({
  id: inv._id, name: inv.name, type: inv.type,
  investedAmount: inv.investedAmount, currentValue: inv.currentValue,
  gainLoss: Math.round(inv.currentValue - inv.investedAmount),
  gainLossPct: inv.investedAmount > 0 ? +((inv.currentValue - inv.investedAmount) / inv.investedAmount * 100).toFixed(2) : 0,
  units: inv.units, purchaseDate: inv.purchaseDate, notes: inv.notes,
  createdAt: inv.createdAt,
});

export const list = wrap(async (req, res) => {
  const items = await Investment.find({ userId: req.user._id }).sort({ purchaseDate: -1 });
  res.json(items.map(fmt));
});

export const portfolio = wrap(async (req, res) => {
  const items = await Investment.find({ userId: req.user._id });
  const invested = items.reduce((s, i) => s + i.investedAmount, 0);
  const current  = items.reduce((s, i) => s + i.currentValue, 0);
  const byType   = {};
  items.forEach(i => { byType[i.type] = (byType[i.type] || 0) + i.currentValue; });
  res.json({
    totalInvested: Math.round(invested), totalCurrentValue: Math.round(current),
    totalGainLoss: Math.round(current - invested),
    totalGainLossPct: invested > 0 ? +((current - invested) / invested * 100).toFixed(2) : 0,
    allocation: Object.entries(byType).map(([type, value]) => ({
      type, value: Math.round(value),
      percentage: current > 0 ? +(value / current * 100).toFixed(2) : 0,
    })),
  });
});

export const create = wrap(async (req, res) => {
  const { name, type, investedAmount, currentValue, units, purchaseDate, notes } = req.body;
  if (!name || !type || investedAmount === undefined || currentValue === undefined || !purchaseDate)
    return res.status(400).json({ error: 'name, type, investedAmount, currentValue, purchaseDate are required.' });
  const today = new Date().toISOString().split('T')[0];
  if (purchaseDate > today) return res.status(400).json({ error: 'Future purchase date not allowed.' });
  const inv = await Investment.create({ userId: req.user._id, name, type, investedAmount: +investedAmount, currentValue: +currentValue, units: units ? +units : undefined, purchaseDate, notes });
  res.status(201).json(fmt(inv));
});

export const update = wrap(async (req, res) => {
  const { name, type, investedAmount, currentValue, units, purchaseDate, notes } = req.body;
  const inv = await Investment.findOneAndUpdate({ _id: req.params.id, userId: req.user._id },
    { name, type, investedAmount: +investedAmount, currentValue: +currentValue, units: units ? +units : undefined, purchaseDate, notes },
    { new: true, runValidators: true });
  if (!inv) return res.status(404).json({ error: 'Investment not found.' });
  res.json(fmt(inv));
});

export const remove = wrap(async (req, res) => {
  const inv = await Investment.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!inv) return res.status(404).json({ error: 'Investment not found.' });
  res.json({ ok: true });
});
