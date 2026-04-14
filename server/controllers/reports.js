import Tx     from '../models/Tx.js';
import { ask } from '../utils/groq.js';
import { ensureSalaryTxs, nowYM, monthRange, toYM } from '../utils/salary.js';
import mongoose from 'mongoose';

const wrap = fn => (req, res, next) => fn(req, res).catch(next);

const SYSTEM = `You are a financial report writer for Indian users. Plain text only — no markdown, no asterisks. Use ₹. Be specific — use only actual numbers from the data. Never invent income figures.`;

export const weekly = wrap(async (req, res) => {
  const uid = new mongoose.Types.ObjectId(req.user._id);
  const ago  = new Date(); ago.setDate(ago.getDate() - 7);
  const from = ago.toISOString().split('T')[0];
  const to   = new Date().toISOString().split('T')[0];

  await ensureSalaryTxs(req.user, monthRange(toYM(from), toYM(to)));


  const [priorTotals, txns, cats] = await Promise.all([
    Tx.aggregate([
      { $match: { userId: uid, date: { $lt: from } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
    Tx.find({ userId: uid, date: { $gte: from, $lte: to } }).lean(),
    Tx.aggregate([
      { $match: { userId: uid, type: 'debit', date: { $gte: from, $lte: to } } },
      { $group: { _id: '$cat', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
  ]);

  const getPrior = k => priorTotals.find(t => t._id === k)?.total || 0;
  const openingBalance = getPrior('credit') - getPrior('debit');

  const weekCredit = txns.filter(t => t.type === 'credit').reduce((a, t) => a + t.amount, 0);
  const weekDebit  = txns.filter(t => t.type === 'debit').reduce((a, t) => a + t.amount, 0);
  const closingBalance = openingBalance + weekCredit - weekDebit;

  const byCat    = Object.fromEntries(cats.map(c => [c._id, Math.round(c.total)]));
  const totalTx  = await Tx.countDocuments({ userId: uid });

  const stats = {
    from, to,
    openingBalance: Math.round(openingBalance),
    weekCredit:     Math.round(weekCredit),
    weekDebit:      Math.round(weekDebit),
    closingBalance: Math.round(closingBalance),
    txCount:        txns.filter(t => t.type === 'debit').length,
    topCats:        cats.slice(0, 3).map(c => ({ cat: c._id, total: Math.round(c.total) })),
  };

  if (totalTx < 3 || txns.filter(t => t.type === 'debit').length === 0) {
    return res.json({
      report: {
        headline:        'Not enough data yet',
        summary:         'Add at least 5 expense transactions to get a meaningful weekly report.',
        topExpenses:     [],
        achievement:     totalTx > 0 ? `${totalTx} transaction(s) recorded so far.` : 'Account is set up. Add your first transaction.',
        goalForNextWeek: 'Record at least 5 transactions this week.',
        savingsTip:      req.user.monthlyIncome ? `Salary ₹${req.user.monthlyIncome.toLocaleString('en-IN')}/month is set and auto-added.` : 'Set your monthly salary in Profile.',
        encouragement:   'Consistent tracking is the foundation of financial control.',
      },
      stats,
      limited: true,
    });
  }

  const prompt = `Weekly report ${from} to ${to}.
Opening Balance: ₹${Math.round(openingBalance)}
Income (Credit) this week: ₹${Math.round(weekCredit)}
Expenses (Debit) this week: ₹${Math.round(weekDebit)}
Closing Balance: ₹${Math.round(closingBalance)}
Expense count: ${stats.txCount}, categories: ${JSON.stringify(byCat)}.
Return ONLY valid JSON (no code blocks): {"headline":"...","summary":"...","topExpenses":[{"cat":"...","amount":0,"tip":"..."}],"achievement":"...","goalForNextWeek":"...","savingsTip":"...","encouragement":"..."}`;

  try {
    const text  = await ask(prompt, 700, SYSTEM);
    const clean = text.replace(/```json|```/g, '').trim();
    const m     = clean.match(/\{[\s\S]*\}/);
    if (m) return res.json({ report: JSON.parse(m[0]), stats });
    throw new Error('parse');
  } catch {
    res.json({
      report: {
        headline:        `${from} → ${to}: ₹${Math.round(weekDebit).toLocaleString('en-IN')} spent`,
        summary:         `Opening balance ₹${Math.round(openingBalance).toLocaleString('en-IN')}. Spent ₹${Math.round(weekDebit).toLocaleString('en-IN')} across ${stats.txCount} transactions. Closing balance ₹${Math.round(closingBalance).toLocaleString('en-IN')}.`,
        topExpenses:     cats.slice(0, 3).map(c => ({ cat: c._id, amount: Math.round(c.total), tip: `Review ${c._id} — ₹${Math.round(c.total).toLocaleString('en-IN')} this week.` })),
        achievement:     `Tracked ${stats.txCount} expenses in ${Object.keys(byCat).length} categories.`,
        goalForNextWeek: cats[0] ? `Reduce ${cats[0]._id} by 10% → save ₹${Math.round(cats[0].total * 0.1).toLocaleString('en-IN')}.` : 'Track every expense this week.',
        savingsTip:      'Set up an auto-SIP of ₹500-1000/month via Groww or Zerodha.',
        encouragement:   'Every tracked rupee is a better decision.',
      },
      stats,
    });
  }
});
