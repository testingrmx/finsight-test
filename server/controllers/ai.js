import Tx         from '../models/Tx.js';
import Investment from '../models/Investment.js';
import Goal       from '../models/Goal.js';
import { ask }    from '../utils/groq.js';
import { autoCat } from '../utils/cats.js';
import { ensureSalaryTxs, nowYM } from '../utils/salary.js';
import mongoose from 'mongoose';

const wrap = fn => (req, res, next) => fn(req, res).catch(next);

const SYSTEM = `You are a personal finance advisor exclusively for Indian users.
Rules:
1. You ONLY answer questions about personal finance, money, budgets, investments, savings, expenses, loans, taxes, and financial planning.
2. If the user asks about anything unrelated to finance or their financial data, politely decline and redirect.
3. Plain text only — no asterisks, no markdown bold, no hashtags, no bullet points with symbols.
4. Under 200 words unless user asks for detail.
5. Use Rs. for all amounts.
6. No filler phrases. Be direct and specific.
7. Always reference the user's actual data with specific numbers when available.
8. Never invent numbers not present in the data provided.
9. Credit = all money received (salary, gifts, refunds, transfers — everything coming in).
10. Debit = all money spent (bills, shopping, rent — everything going out).
11. Savings pool = all-time cumulative (total credit - total debit).
12. Monthly balance = credit this month minus debit. Surplus added to pool; deficit drawn from it.`;

const buildContext = async (userId, from, to) => {
  const uid = new mongoose.Types.ObjectId(userId);
  const now  = new Date();
  const s = from || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const e = to   || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [txns, cats, allAgg, investments, goals] = await Promise.all([
    Tx.find({ userId: uid, date: { $gte: s, $lte: e } }).lean(),
    Tx.aggregate([
      { $match: { userId: uid, type: 'debit', date: { $gte: s, $lte: e } } },
      { $group: { _id: '$cat', total: { $sum: '$amount' } } },
      { $sort:  { total: -1 } },
    ]),
    Tx.aggregate([
      { $match: { userId: uid } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
    Investment.find({ userId: uid }).lean(),
    Goal.find({ userId: uid }).lean(),
  ]);

  const getAll = k => allAgg.find(t => t._id === k)?.total || 0;
  const savPool = getAll('credit') - getAll('debit');

  const credit = txns.filter(t => t.type === 'credit').reduce((a,t) => a + t.amount, 0);
  const debit  = txns.filter(t => t.type === 'debit').reduce((a,t)  => a + t.amount, 0);
  const net    = credit - debit;

  const portfolioValue = investments.reduce((s, i) => s + i.currentValue, 0);
  const totalInvested  = investments.reduce((s, i) => s + i.investedAmount, 0);
  const goalsInfo = goals.map(g => `${g.name}: saved Rs.${Math.round(g.currentAmount)} of Rs.${Math.round(g.targetAmount)} (${g.category})`).join(', ');

  const byCat = Object.fromEntries(cats.map(c => [c._id, Math.round(c.total)]));

  return { s, e, credit: Math.round(credit), debit: Math.round(debit), net: Math.round(net), savPool: Math.round(savPool), byCat, count: txns.length, portfolioValue: Math.round(portfolioValue), totalInvested: Math.round(totalInvested), goalsInfo };
};

export const chat = wrap(async (req, res) => {
  const { message, history = [], rangeFrom, rangeTo } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message required.' });
  await ensureSalaryTxs(req.user, [nowYM()]);
  const ctx = await buildContext(req.user._id, rangeFrom, rangeTo);

  let dataBlock;
  if (ctx.count > 0) {
    const savingsRate = ctx.credit > 0 ? ((ctx.net / ctx.credit) * 100).toFixed(1) : 0;
    dataBlock = `User financial data for period ${ctx.s} to ${ctx.e}:
- Total credit (money in): Rs.${ctx.credit.toLocaleString('en-IN')} (salary, income, gifts, transfers)
- Total debit (money out): Rs.${ctx.debit.toLocaleString('en-IN')} (all expenses)
- Period net: Rs.${ctx.net.toLocaleString('en-IN')} (${ctx.net >= 0 ? 'surplus — added to savings' : 'deficit — drawn from savings pool'})
- Savings rate: ${savingsRate}%
- Cumulative savings pool (all time): Rs.${ctx.savPool.toLocaleString('en-IN')}
- Expense breakdown by category: ${JSON.stringify(ctx.byCat)}
${ctx.portfolioValue > 0 ? `- Investment portfolio current value: Rs.${ctx.portfolioValue.toLocaleString('en-IN')} (total invested: Rs.${ctx.totalInvested.toLocaleString('en-IN')})` : ''}
${ctx.goalsInfo ? `- Savings goals: ${ctx.goalsInfo}` : ''}`;
  } else {
    dataBlock = `No transactions found for ${ctx.s} to ${ctx.e}. Provide general financial advice.`;
  }

  const hist   = history.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n');
  const prompt = (hist ? hist + '\n\n' : '') + dataBlock + '\n\nUser: ' + message.trim();

  try {
    const reply = await ask(prompt, 500, SYSTEM);
    res.json({ reply });
  } catch (e) {
    res.status(503).json({ error: e.message?.includes('GROQ') ? 'AI not configured. Add GROQ_API_KEY to .env' : 'AI unavailable. Try again.' });
  }
});

export const tips = wrap(async (req, res) => {
  await ensureSalaryTxs(req.user, [nowYM()]);
  const ctx = await buildContext(req.user._id);

  if (ctx.count < 3) {
    return res.json({ tips: ['Add at least 5 transactions to unlock personalised AI insights.'] });
  }

  const savingsRate = ctx.credit > 0 ? ((ctx.net / ctx.credit) * 100).toFixed(1) : 0;
  const prompt = `Financial snapshot:
- Credit (money in): Rs.${ctx.credit.toLocaleString('en-IN')}, Debit (money out): Rs.${ctx.debit.toLocaleString('en-IN')}
- Net: Rs.${ctx.net.toLocaleString('en-IN')}, Savings rate: ${savingsRate}%, Savings pool: Rs.${ctx.savPool.toLocaleString('en-IN')}
- By category: ${JSON.stringify(ctx.byCat)}
${ctx.portfolioValue > 0 ? `- Portfolio: Rs.${ctx.portfolioValue.toLocaleString('en-IN')}` : ''}

Give exactly 3 short, specific, actionable financial tips. Each max 20 words. Plain text, no bullets, no markdown. Separate with |`;

  try {
    const raw  = await ask(prompt, 200, SYSTEM);
    const tips = raw.split('|').map(t => t.trim()).filter(Boolean).slice(0, 3);
    res.json({ tips: tips.length ? tips : ['Keep tracking your expenses to unlock personalised insights.'] });
  } catch {
    res.json({ tips: [] });
  }
});

export const categorise = wrap(async (req, res) => {
  const { desc } = req.body;
  if (!desc?.trim()) return res.status(400).json({ error: 'Description required.' });
  res.json({ cat: autoCat(desc) });
});
