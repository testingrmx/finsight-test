import Tx         from '../models/Tx.js';
import Investment from '../models/Investment.js';
import Goal       from '../models/Goal.js';
import Budget     from '../models/Budget.js';
import { autoCat } from '../utils/cats.js';
import { ensureSalaryTxs, nowYM, nowDate, toYM } from '../utils/salary.js';
import mongoose from 'mongoose';

const wrap = fn => (req, res, next) => fn(req, res).catch(next);

export const list = wrap(async (req, res) => {
  const { from, to, cat, type, page = 1, limit = 300 } = req.query;
  const q = { userId: req.user._id };
  if (from && to) q.date = { $gte: from, $lte: to };
  else if (from)  q.date = { $gte: from };
  else if (to)    q.date = { $lte: to };
  if (cat  && cat  !== 'all') q.cat  = cat;
  if (type && type !== 'all') q.type = type;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [items, total] = await Promise.all([
    Tx.find(q).sort({ date: -1, createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
    Tx.countDocuments(q),
  ]);
  res.json({ items, total });
});

export const create = wrap(async (req, res) => {
  const { desc, amount, cat, type, date, notes } = req.body;
  if (!desc?.trim())             return res.status(400).json({ error: 'Description is required.' });
  if (!amount || +amount < 0.01) return res.status(400).json({ error: 'Valid amount is required.' });
  if (!type)                     return res.status(400).json({ error: 'Type is required.' });
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'Valid date is required.' });
  if (date > nowDate())          return res.status(400).json({ error: 'Future dates are not allowed.' });
  if (!['credit', 'debit'].includes(type)) return res.status(400).json({ error: 'Type must be credit or debit.' });
  const resolvedCat = cat || autoCat(desc);
  const t = await Tx.create({ userId: req.user._id, desc: desc.trim(), amount: parseFloat(amount), cat: resolvedCat, type, date, notes: notes?.trim() || '', src: 'manual' });
  await ensureSalaryTxs(req.user, [toYM(date)]);
  res.status(201).json({ item: t });
});

export const remove = wrap(async (req, res) => {
  const t = await Tx.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!t) return res.status(404).json({ error: 'Transaction not found.' });
  res.json({ ok: true, id: req.params.id });
});

export const overview = wrap(async (req, res) => {
  const uid = new mongoose.Types.ObjectId(req.user._id);
  await ensureSalaryTxs(req.user, [nowYM()]);

  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  const ym    = nowYM();

  const [monthTotals, allTimeTotals, topCats, recent, investments, goals, budgets] = await Promise.all([
    Tx.aggregate([{ $match: { userId: uid, date: { $gte: start, $lte: end } } }, { $group: { _id: '$type', total: { $sum: '$amount' } } }]),
    Tx.aggregate([{ $match: { userId: uid } }, { $group: { _id: '$type', total: { $sum: '$amount' } } }]),
    Tx.aggregate([{ $match: { userId: uid, type: 'debit', date: { $gte: start, $lte: end } } }, { $group: { _id: '$cat', total: { $sum: '$amount' } } }, { $sort: { total: -1 } }, { $limit: 5 }]),
    Tx.find({ userId: uid }).sort({ date: -1, createdAt: -1 }).limit(6).lean(),
    Investment.find({ userId: uid }),
    Goal.find({ userId: uid }),
    Budget.find({ userId: uid, month: ym }),
  ]);

  const get = (arr, k) => arr.find(t => t._id === k)?.total || 0;
  const monthCredit = get(monthTotals, 'credit');
  const monthDebit  = get(monthTotals, 'debit');
  const allCredit   = get(allTimeTotals, 'credit');
  const allDebit    = get(allTimeTotals, 'debit');

  const savingsPool = allCredit - allDebit;
  const monthNet    = monthCredit - monthDebit;
  const rate = monthCredit > 0 ? +((monthNet / monthCredit) * 100).toFixed(1) : null;

  const portfolioValue = investments.reduce((s, i) => s + i.currentValue, 0);
  const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount).length;

  let budgetsExceeded = 0;
  if (budgets.length) {
    const bSpent = await Tx.aggregate([
      { $match: { userId: uid, type: 'debit', date: { $gte: start, $lte: end } } },
      { $group: { _id: '$cat', total: { $sum: '$amount' } } },
    ]);
    const spentMap = Object.fromEntries(bSpent.map(r => [r._id, r.total]));
    budgetsExceeded = budgets.filter(b => (spentMap[b.category] || 0) > b.allocatedAmount).length;
  }

  res.json({
    monthlyIncome:  req.user.monthlyIncome || null,
    salaryPaused:   req.user.salaryPaused  || false,
    totalCredit:    Math.round(monthCredit),
    totalDebit:     Math.round(monthDebit),
    monthNet:       Math.round(monthNet),
    savingsPool:    Math.round(savingsPool),
    savingsRate:    rate,
    portfolioValue: Math.round(portfolioValue),
    totalGoals:     goals.length,
    completedGoals,
    activeBudgets:  budgets.length,
    budgetsExceeded,
    topCats:        topCats.map(c => ({ cat: c._id, total: Math.round(c.total) })),
    recent,
  });
});

export const catSummary = wrap(async (req, res) => {
  const uid  = new mongoose.Types.ObjectId(req.user._id);
  const now  = new Date();
  const from = req.query.from || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const to   = req.query.to   || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  const data = await Tx.aggregate([
    { $match: { userId: uid, type: 'debit', date: { $gte: from, $lte: to } } },
    { $group: { _id: '$cat', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);
  res.json({ data: data.map(d => ({ cat: d._id, total: Math.round(d.total), count: d.count })) });
});

export const dailySpend = wrap(async (req, res) => {
  const uid  = new mongoose.Types.ObjectId(req.user._id);
  const days = Math.min(parseInt(req.query.days) || 30, 365);
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days + 1);
  const from = cutoff.toISOString().split('T')[0];
  const to   = new Date().toISOString().split('T')[0];
  const raw  = await Tx.aggregate([
    { $match: { userId: uid, type: 'debit', date: { $gte: from, $lte: to } } },
    { $group: { _id: '$date', total: { $sum: '$amount' }, cats: { $push: '$cat' } } },
    { $sort:  { _id: 1 } },
  ]);
  res.json({ data: raw.map(r => ({ date: r._id, total: Math.round(r.total), cats: r.cats })) });
});

export const monthlySummary = wrap(async (req, res) => {
  const uid = new mongoose.Types.ObjectId(req.user._id);
  const allDates = await Tx.distinct('date', { userId: uid });
  if (allDates.length > 0) {
    const yms = [...new Set(allDates.map(d => d.slice(0, 7)))].sort();
    await ensureSalaryTxs(req.user, yms);
  }
  const data = await Tx.aggregate([
    { $match: { userId: uid } },
    {
      $group: {
        _id:    { $substr: ['$date', 0, 7] },
        debit:  { $sum: { $cond: [{ $eq: ['$type', 'debit']  }, '$amount', 0] } },
        credit: { $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0] } },
      }
    },
    { $sort: { _id: 1 } },
    { $limit: 24 },
  ]);
  let running = 0;
  const result = data.map(d => {
    const [yr, mo] = d._id.split('-');
    const dt     = new Date(parseInt(yr), parseInt(mo) - 1, 1);
    const credit = Math.round(d.credit);
    const debit  = Math.round(d.debit);
    const net    = credit - debit;
    running     += net;
    return { month: dt.toLocaleString('en-IN', { month: 'short' }) + " '" + yr.slice(2), ym: d._id, credit, debit, net, running: Math.round(running) };
  });
  res.json({ data: result });
});

export const runningBalance = wrap(async (req, res) => {
  const uid = new mongoose.Types.ObjectId(req.user._id);
  await ensureSalaryTxs(req.user, [nowYM()]);
  const data = await Tx.aggregate([
    { $match: { userId: uid } },
    {
      $group: {
        _id:    { $substr: ['$date', 0, 7] },
        credit: { $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0] } },
        debit:  { $sum: { $cond: [{ $eq: ['$type', 'debit']  }, '$amount', 0] } },
      }
    },
    { $sort: { _id: 1 } },
  ]);

  let running = 0;
  const months = data.map(d => {
    const net = d.credit - d.debit;
    running  += net;
    return { ym: d._id, credit: Math.round(d.credit), debit: Math.round(d.debit), net: Math.round(net), running: Math.round(running) };
  });

  const cur         = nowYM();
  const curMonth    = months.find(m => m.ym === cur) || { ym: cur, credit: 0, debit: 0, net: 0, running: 0 };
  const prevIdx     = months.findIndex(m => m.ym === cur);
  const prevBalance = prevIdx > 0 ? months[prevIdx - 1].running : (months.length > 0 && months[months.length - 1].ym !== cur ? months[months.length - 1].running : 0);

  res.json({
    currentMonth: {
      credit:         curMonth.credit,
      debit:          curMonth.debit,
      net:            curMonth.net,
      remaining:      Math.max(0, curMonth.credit - curMonth.debit),
      deficit:        Math.max(0, curMonth.debit - curMonth.credit),
      prevBalance,
      closingBalance: running,
    },
    months,
  });
});

export const salaryMonths = wrap(async (req, res) => {
  const uid = new mongoose.Types.ObjectId(req.user._id);
  const rows = await Tx.find({ userId: uid, src: 'salary' }).sort({ date: -1 }).lean();
  const yms = [...new Set(rows.map(r => r.date.slice(0,7)))];
  res.json({ months: yms });
});
