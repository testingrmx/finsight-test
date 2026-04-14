import { useEffect, useState, useCallback } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { A } from '../services/api.js';
import { fmt, CC, CHART_COLORS, dAgo, today } from '../utils/h.js';
import { useAuth } from '../context/Auth.jsx';

const RANGES = [{ l:'7d',v:7 },{ l:'14d',v:14 },{ l:'30d',v:30 },{ l:'60d',v:60 },{ l:'90d',v:90 }];

function buildCatColorMap(cats) {
  const map = {};
  cats.forEach((c, i) => {
    map[c.cat] = CC[c.cat] || CHART_COLORS[i % CHART_COLORS.length];
  });
  return map;
}

export default function Charts() {
  const { dark } = useAuth();
  const [cats,      setCats]      = useState([]);
  const [catColors, setCatColors] = useState({});
  const [daily,     setDaily]     = useState([]);
  const [dailyAll,  setDailyAll]  = useState([]);
  const [mon,       setMon]       = useState([]);
  const [busy,      setBusy]      = useState(true);
  const [days,      setDays]      = useState(30);
  const [activeCat, setActiveCat] = useState(null);
  const [selMonth,  setSelMonth]  = useState(null);

  const ax   = dark ? '#484f58' : '#8c959f';
  const grid = dark ? '#21262d' : '#e8ecf0';
  const cardBg = dark ? '#1c2128' : '#ffffff';
  const textPri = dark ? '#e6edf3' : '#1c2128';

  const load = useCallback(async d => {
    setBusy(true);
    setActiveCat(null);
    setSelMonth(null);
    const to = today(), from = dAgo(d - 1);
    try {
      const [c, dl, m] = await Promise.all([A.txCats({ from, to }), A.txDaily({ days: d }), A.txMonthly()]);
      const catData = c.data.data || [];
      setCats(catData);
      setCatColors(buildCatColorMap(catData));
      const dayMap = Object.fromEntries((dl.data.data || []).map(x => [x.date, { total: x.total, cats: x.cats || [] }]));
      const filled = [];
      for (let i = d - 1; i >= 0; i--) {
        const dt = new Date(); dt.setDate(dt.getDate() - i);
        const k  = dt.toISOString().split('T')[0];
        filled.push({ date: dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), fullDate: k, amount: dayMap[k]?.total || 0, cats: dayMap[k]?.cats || [] });
      }
      setDaily(filled);
      setDailyAll(filled);
      setMon(m.data.data || []);
    } catch {} finally { setBusy(false); }
  }, []);

  useEffect(() => { load(days); }, [days]);

  const total      = cats.reduce((s, c) => s + c.total, 0);
  const totalSpent = daily.reduce((s, d) => s + d.amount, 0);
  const activeDays = daily.filter(d => d.amount > 0).length;

  const handleCatClick = useCallback(async catName => {
    setSelMonth(null);
    if (activeCat === catName) {
      setActiveCat(null);
      setDaily(dailyAll);
      return;
    }
    setActiveCat(catName);
    try {
      const { data } = await A.txList({ from: dAgo(days - 1), to: today(), cat: catName, limit: 500 });
      const byDate = {};
      (data.items || []).filter(t => t.type === 'debit').forEach(t => {
        byDate[t.date] = (byDate[t.date] || 0) + t.amount;
      });
      setDaily(dailyAll.map(d => ({ ...d, amount: byDate[d.fullDate] || 0 })));
    } catch {}
  }, [activeCat, days, dailyAll]);

  const handleMonthClick = useCallback(payload => {
    if (!payload?.activeLabel) return;
    setActiveCat(null);
    const clicked = mon.find(m => m.month === payload.activeLabel);
    if (!clicked) return;
    setSelMonth(prev => prev?.ym === clicked.ym ? null : clicked);
    if (clicked) {
      setDaily(dailyAll.map(d => {
        const inMonth = d.fullDate?.slice(0, 7) === clicked.ym;
        return { ...d, amount: inMonth ? d.amount : 0 };
      }));
    } else {
      setDaily(dailyAll);
    }
  }, [mon, dailyAll]);

  const dotColor = activeCat ? (catColors[activeCat] || '#f97316') : selMonth ? '#d29922' : '#22c55e';

  const CustomDot = ({ cx, cy, value }) => {
    if (!value) return null;
    return <circle cx={cx} cy={cy} r={4} fill={dotColor} stroke={cardBg} strokeWidth={2}/>;
  };

  const PieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const item = payload[0];
    const col  = catColors[item.name] || '#94a3b8';
    return (
      <div style={{ background: cardBg, border: `2px solid ${col}`, borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,.4)', minWidth: 150 }}>
        <p style={{ color: col, fontWeight: 700, marginBottom: 4, fontSize: 14 }}>{item.name}</p>
        <p style={{ color: textPri, fontWeight: 800, fontSize: 18 }}>{fmt(item.value)}</p>
        <p style={{ color: ax, fontSize: 11, marginTop: 2 }}>{total > 0 ? (item.value / total * 100).toFixed(1) : 0}% of expenses</p>
      </div>
    );
  };

  const AreaTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: cardBg, border: '1px solid var(--brd)', borderRadius: 8, padding: '10px 12px', boxShadow: '0 4px 16px rgba(0,0,0,.3)' }}>
        <p style={{ color: ax, marginBottom: 4, fontWeight: 600, fontSize: 12 }}>{label}</p>
        <p style={{ fontWeight: 700, fontSize: 15, color: dotColor }}>{fmt(payload[0]?.value)}</p>
      </div>
    );
  };

  const MonthTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: cardBg, border: '1px solid var(--brd)', borderRadius: 8, padding: '10px 12px', boxShadow: '0 4px 16px rgba(0,0,0,.3)', minWidth: 160 }}>
        <p style={{ color: ax, fontWeight: 700, marginBottom: 6, fontSize: 12 }}>{label}</p>
        {payload.map(p => (
          <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3, fontSize: 12 }}>
            <span style={{ color: p.color || p.fill }}>{p.name}</span>
            <span style={{ fontWeight: 700, color: textPri }}>{fmt(p.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  const selMonthData = selMonth ? [selMonth.ym] : null;

  return (
    <div className="fade" style={{ width: '100%' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div>
          {activeCat ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: catColors[activeCat] || 'var(--g)' }}>Filtered: {activeCat}</span>
              <button onClick={() => handleCatClick(activeCat)} style={{ padding: '3px 10px', background: 'var(--redl)', border: '1px solid rgba(248,81,73,.3)', color: 'var(--red)', borderRadius: 999, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Clear</button>
            </div>
          ) : selMonth ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--amb)' }}>Month: {selMonth.month}</span>
              <button onClick={() => { setSelMonth(null); setDaily(dailyAll); }} style={{ padding: '3px 10px', background: 'var(--redl)', border: '1px solid rgba(248,81,73,.3)', color: 'var(--red)', borderRadius: 999, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Clear</button>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--t2)' }}>Click any chart element to cross-filter all charts</p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>Show:</span>
          {RANGES.map(r => (
            <button key={r.v} onClick={() => setDays(r.v)}
              style={{ padding: '5px 12px', border: '1px solid', borderRadius: 999, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .13s',
                borderColor: days === r.v ? 'var(--g)' : 'var(--brd)', background: days === r.v ? 'var(--gl)' : 'transparent',
                color: days === r.v ? 'var(--g)' : 'var(--t3)', fontWeight: days === r.v ? 600 : 400 }}>
              {r.l}
            </button>
          ))}
          {busy && <span className="spin" style={{ width: 14, height: 14 }}/>}
        </div>
      </div>

      {!busy && (
        <div className="g3" style={{ marginBottom: 14 }}>
          {[
            { l: activeCat ? `${activeCat} (${days}d)` : selMonth ? `${selMonth.month} spend` : `Total spent (${days}d)`, v: fmt(totalSpent), c: 'var(--red)' },
            { l: 'Days with spending', v: activeDays, c: 'var(--t1)' },
            { l: 'Daily average', v: activeDays > 0 ? fmt(Math.round(totalSpent / activeDays)) : '—', c: 'var(--amb)' },
          ].map(s => (
            <div key={s.l} className="sc" style={{ textAlign: 'center', padding: '12px 14px' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.c }}>{s.v}</div>
              <div className="sl">{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {cats.length > 0 && (
        <div className="g2" style={{ marginBottom: 14 }}>
          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>Expenses by Category</div>
            <p style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 8 }}>Click a slice to cross-filter all charts</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={cats} dataKey="total" nameKey="cat" cx="50%" cy="50%"
                  outerRadius={88} innerRadius={52} paddingAngle={2}
                  onClick={d => handleCatClick(d.cat)} style={{ cursor: 'pointer' }}>
                  {cats.map((c, i) => (
                    <Cell key={c.cat}
                      fill={catColors[c.cat] || CHART_COLORS[i % CHART_COLORS.length]}
                      opacity={activeCat && activeCat !== c.cat ? 0.12 : 1}
                      stroke={activeCat === c.cat ? '#fff' : 'transparent'}
                      strokeWidth={activeCat === c.cat ? 3 : 0}/>
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip/>}/>
              </PieChart>
            </ResponsiveContainer>
            {activeCat && (() => {
              const ac = cats.find(c => c.cat === activeCat);
              if (!ac) return null;
              const col = catColors[ac.cat] || '#22c55e';
              return (
                <div style={{ marginTop: 10, padding: '12px 14px', borderRadius: 'var(--r2)', background: col + '18', border: `2px solid ${col}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: col }}>{ac.cat}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-.5px' }}>{fmt(ac.total)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: col }}>{total > 0 ? (ac.total / total * 100).toFixed(1) : 0}%</div>
                    <div style={{ fontSize: 11, color: 'var(--t2)' }}>of expenses</div>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>
              Top Categories
            </div>
            {cats.map((c, i) => {
              const isActive = activeCat === c.cat;
              const isDimmed = activeCat && !isActive;
              const col = catColors[c.cat] || CHART_COLORS[i % CHART_COLORS.length];
              return (
                <div key={c.cat} onClick={() => handleCatClick(c.cat)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, cursor: 'pointer', padding: '7px 9px', borderRadius: 'var(--r2)', transition: 'all .13s',
                    opacity: isDimmed ? 0.15 : 1, background: isActive ? col + '18' : 'transparent',
                    outline: isActive ? `2px solid ${col}` : '2px solid transparent' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: col, display: 'block', flexShrink: 0 }}/>
                  <span style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isActive ? col : 'var(--t2)', fontWeight: isActive ? 700 : 400 }}>{c.cat}</span>
                  <div style={{ width: 80, height: 5, background: 'var(--card2)', borderRadius: 3, overflow: 'hidden', flexShrink: 0 }}>
                    <div style={{ height: '100%', borderRadius: 3, background: col, width: (total > 0 ? c.total / total * 100 : 0) + '%', transition: 'width .5s' }}/>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, minWidth: 64, textAlign: 'right', color: isActive ? col : 'var(--t2)' }}>{fmt(c.total)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
            {activeCat ? `${activeCat} — Daily` : selMonth ? `${selMonth.month} — Daily` : `Daily Spending — Last ${days} Days`}
          </div>
          {(activeCat || selMonth) && (
            <span style={{ fontSize: 11, color: dotColor, fontWeight: 600, padding: '2px 8px', background: dotColor + '18', borderRadius: 999 }}>
              {activeCat || selMonth?.month}
            </span>
          )}
        </div>
        {daily.some(d => d.amount > 0) ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={daily} margin={{ top: 8, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="spGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={dotColor} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={dotColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false}/>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: ax }} interval={days <= 14 ? 0 : Math.floor(days / 7)} tickLine={false} axisLine={false}/>
              <YAxis tick={{ fontSize: 10, fill: ax }} tickFormatter={v => '₹' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)} tickLine={false} axisLine={false} width={44}/>
              <Tooltip content={<AreaTooltip/>}/>
              <Area type="monotone" dataKey="amount" stroke={dotColor} fill="url(#spGrad)" strokeWidth={2.5}
                dot={<CustomDot/>} activeDot={{ r: 6, fill: dotColor, stroke: cardBg, strokeWidth: 2 }}/>
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--t3)', fontSize: 13 }}>
            {activeCat ? `No ${activeCat} spending in this period.` : 'No spending data.'}
          </div>
        )}
      </div>

      {cats.length === 0 && !busy && (
        <div className="empty">
          <div className="empty-title">No data for this period</div>
          <div className="empty-sub">Add transactions or select a longer date range.</div>
        </div>
      )}
    </div>
  );
}
