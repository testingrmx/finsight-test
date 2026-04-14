import { useState, useEffect } from 'react';
import { A } from '../services/api.js';
import { useAuth } from '../context/Auth.jsx';
import { fmt, CI } from '../utils/h.js';
import { toast } from '../components/ui/Toast.jsx';

export default function Reports() {
  const { user } = useAuth();
  const uid = user?.id || user?._id || 'guest';
  const storeKey = `fs_report_${uid}`;

  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storeKey));
      setData(saved || null);
    } catch {
      setData(null);
    }
    setLoaded(true);
  }, [uid]);

  useEffect(() => {
    if (data) localStorage.setItem(storeKey, JSON.stringify(data));
  }, [data, storeKey]);

  const generate = async () => {
    setBusy(true);
    try {
      const r = await A.repWeekly();
      setData(r.data);
      toast.ok('Report generated.');
    } catch (e) {
      toast.err(e.response?.data?.error || 'Failed to generate report.');
    } finally { setBusy(false); }
  };

  const rp = data?.report;
  const st = data?.stats;

  const HL = [
    { k: 'achievement',     label: 'Achievement',    bg: 'var(--gl)',   bc: 'var(--g)'   },
    { k: 'goalForNextWeek', label: 'Goal Next Week',  bg: 'var(--blul)', bc: 'var(--blu)' },
    { k: 'savingsTip',      label: 'Savings Tip',     bg: 'var(--ambl)', bc: 'var(--amb)' },
  ];

  if (!loaded) return <div className="spc"><div className="spin" style={{ width: 28, height: 28 }}/></div>;

  return (
    <div className="fade" style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', marginBottom: 2 }}>Weekly Report</h2>
          {st && <p style={{ fontSize: 11, color: 'var(--t3)' }}>{st.from} to {st.to}</p>}
        </div>
        <button className="btn bp" onClick={generate} disabled={busy}>
          {busy ? <><span className="spin" style={{ width: 12, height: 12, borderTopColor: '#fff' }}/> Generating...</> : (data ? 'Regenerate' : 'Generate Report')}
        </button>
      </div>

      {!data && !busy && (
        <div className="empty" style={{ minHeight: 300 }}>
          <div style={{ width: 48, height: 48, borderRadius: 'var(--r3)', background: 'var(--card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, fontSize: 22 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
          <div className="empty-title">Generate your weekly report</div>
          <div className="empty-sub">Get a personalised summary of spending, savings, and actionable tips based on your actual transactions.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10, textAlign: 'left', width: '100%', maxWidth: 280 }}>
            {['Spending breakdown by category', 'Savings analysis and rate', 'Specific tips to cut expenses', 'Goals for next week'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--t2)' }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--g)', flexShrink: 0 }}/>
                {t}
              </div>
            ))}
          </div>
          <button className="btn bp" onClick={generate} style={{ marginTop: 16, padding: '9px 24px' }}>Generate My Report</button>
        </div>
      )}

      {busy && !data && (
        <div className="spc">
          <div className="spin" style={{ width: 28, height: 28 }}/>
          <p style={{ color: 'var(--t2)', fontSize: 13 }}>Analysing your transactions...</p>
        </div>
      )}

      {st && (
        <div className="g4" style={{ marginBottom: 14 }}>
          {[
            { l: 'Opening Balance', v: fmt(st.openingBalance),                                    c: st.openingBalance >= 0 ? 'var(--blu)' : 'var(--red)' },
            { l: 'Credit (In)',     v: st.weekCredit > 0 ? fmt(st.weekCredit) : '₹0',             c: 'var(--g)'   },
            { l: 'Debit (Spent)',   v: fmt(st.weekDebit),                                          c: 'var(--red)' },
            { l: 'Closing Balance', v: fmt(st.closingBalance),                                     c: st.closingBalance >= 0 ? 'var(--blu)' : 'var(--red)' },
          ].map(s => (
            <div key={s.l} className="sc" style={{ textAlign: 'center' }}>
              <div className="sv" style={{ color: s.c, fontSize: 18 }}>{s.v}</div>
              <div className="sl">{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {st?.topCats?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {st.topCats.map(c => (
            <div key={c.cat} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', border: '1px solid var(--brd)', borderRadius: 999, background: 'var(--card)', fontSize: 12 }}>
              <span style={{ fontWeight: 500 }}>{c.cat}</span>
              <span style={{ color: 'var(--t2)', fontWeight: 600 }}>{fmt(c.total)}</span>
            </div>
          ))}
        </div>
      )}

      {data?.limited && rp && (
        <div className="al aw" style={{ marginBottom: 12, fontSize: 12 }}>
          <span>Limited data this week. Add more transactions for a complete analysis.</span>
        </div>
      )}

      {rp && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--brd)' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>AI Report</span>
            <span style={{ fontSize: 11, color: 'var(--t3)' }}>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          {rp.headline && <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.3 }}>{rp.headline}</h3>}
          {rp.summary  && <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.7 }}>{rp.summary}</p>}
          {rp.topExpenses?.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>Top Expense Areas</div>
              {rp.topExpenses.map((e, i) => (
                <div key={i} style={{ background: 'var(--card2)', borderRadius: 'var(--r2)', padding: '10px 12px', marginBottom: 6, border: '1px solid var(--brd)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{e.cat}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>{fmt(e.amount)}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5 }}>{e.tip}</p>
                </div>
              ))}
            </div>
          )}
          {HL.map(({ k, label, bg, bc }) => rp[k] ? (
            <div key={k} style={{ padding: '11px 13px', borderRadius: 'var(--r2)', background: bg, borderLeft: '2px solid ' + bc }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>{label}</div>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--t1)' }}>{rp[k]}</p>
            </div>
          ) : null)}
          {rp.encouragement && (
            <p style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', paddingTop: 10, borderTop: '1px solid var(--brd)', fontStyle: 'italic' }}>{rp.encouragement}</p>
          )}
        </div>
      )}
    </div>
  );
}
