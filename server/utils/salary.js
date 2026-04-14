import Tx from '../models/Tx.js';

export const nowYM = () => new Date().toISOString().slice(0, 7);
export const nowDate = () => new Date().toISOString().split('T')[0];

export const toYM = d => {
  if (!d) return nowYM();
  return (typeof d === 'string' ? d : d.toISOString()).slice(0, 7);
};

export const monthRange = (startYM, endYM) => {
  const out = [];
  let [y, m] = startYM.split('-').map(Number);
  const [ey, em] = endYM.split('-').map(Number);
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    if (++m > 12) { m = 1; y++; }
  }
  return out;
};

export const ensureSalaryTxs = async (user, yms) => {
  if (!user.monthlyIncome || user.monthlyIncome <= 0 || user.salaryPaused) return;
  const cur = nowYM();
  for (const ym of yms) {
    if (ym > cur) continue;
    await Tx.findOneAndUpdate(
      { userId: user._id, src: 'salary', date: ym + '-01' },
      {
        $setOnInsert: {
          userId: user._id,
          desc:   'Monthly Salary',
          amount: user.monthlyIncome,
          cat:    'Salary',
          type:   'credit',
          date:   ym + '-01',
          notes:  '',
          src:    'salary',
        }
      },
      { upsert: true, new: false }
    );
  }
};

export const updateSalaryTxs = async (user, newAmount, paused) => {
  const cur = nowYM();
  await Tx.deleteMany({ userId: user._id, src: 'salary', date: { $gte: cur + '-01' } });
  if (!newAmount || newAmount <= 0 || paused) return;
  const allDates = await Tx.distinct('date', { userId: user._id });
  const yms = [...new Set(allDates.map(d => d.slice(0, 7)))].sort();
  const tempUser = { _id: user._id, monthlyIncome: newAmount, salaryPaused: false };
  await ensureSalaryTxs(tempUser, [...yms, cur]);
};

export const deleteSalaryForMonth = async (userId, ym) => {
  await Tx.deleteOne({ userId, src: 'salary', date: ym + '-01' });
};
