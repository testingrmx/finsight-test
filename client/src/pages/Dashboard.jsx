import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { A } from '../services/api.js';
import { useAuth } from '../context/Auth.jsx';
import { fmt, relD, CC, CI } from '../utils/h.js';

export default function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [ov,   setOv]   = useState(null);
  const [bal,  setBal]  = useState(null);
  const [tips, setTips] = useState([]);
  const [busy, setBusy] = useState(true);
  const [err,  setErr]  = useState(false);

  useEffect(() => {
    Promise.all([A.txOverview(), A.txBalance(), A.aiTips()])
      .then(([a, b, c]) => {
        setOv(a.data);
        setBal(b.data);
        setTips(c.data.tips || []);
      })
      .catch(() => setErr(true))
      .finally(() => setBusy(false));
  }, []);

  if (busy) return <div className="spc"><div className="spin" style={{ width:28, height:28 }}/></div>;

  if (err) return (
    <div className="spc">
      <p style={{ color:'var(--t3)', fontSize:14 }}>Could not load dashboard data.</p>
      <button className="btn bp bsm" onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  const mi         = ov?.monthlyIncome;
  const cur        = bal?.currentMonth;
  const credit     = cur?.credit      || 0;
  const debit      = cur?.debit       || 0;
  const remaining  = cur?.remaining   || 0;
  const deficit    = cur?.deficit     || 0;
  const prevBal    = cur?.prevBalance || 0;
  const closingBal = cur?.closingBalance ?? 0;

  const hr     = new Date().getHours();
  const gr     = hr < 12 ? 'morning' : hr < 17 ? 'afternoon' : 'evening';
  const mLabel = new Date().toLocaleString('en-IN', { month:'long', year:'numeric' });

  const spPct  = credit > 0 ? debit / credit * 100 : (debit > 0 ? 100 : 0);
  const spColor = spPct > 80 ? 'var(--red)' : spPct > 55 ? 'var(--amb)' : 'var(--g)';
  const R = 44, circ = 2 * Math.PI * R, used = (Math.min(100, spPct) / 100) * circ;

  const savingsRate = ov?.savingsRate;

  return (
    <div className="fade" style={{ width:'100%' }}>

      {!mi && (
        <div className="al aw">
          Set your monthly salary in <strong>Profile</strong> to auto-track income.
          <button className="btn bg bsm" style={{ marginLeft:'auto', flexShrink:0 }} onClick={() => nav('/prof')}>Set now</button>
        </div>
      )}

      {ov?.budgetsExceeded > 0 && (
        <div className="al ar">
          {ov.budgetsExceeded} budget{ov.budgetsExceeded > 1 ? 's' : ''} exceeded this month.
          <button className="btn bg bsm" style={{ marginLeft:'auto', flexShrink:0 }} onClick={() => nav('/budgets')}>View</button>
        </div>
      )}

      <div style={{ marginBottom:14 }}>
        <h2 style={{ fontSize:17, fontWeight:700, color:'var(--t1)' }}>Good {gr}, {user?.name?.split(' ')[0]}</h2>
        <p style={{ fontSize:12, color:'var(--t3)', marginTop:1 }}>{mLabel}</p>
      </div>

      <div className="card" style={{ marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:8 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.07em' }}>Monthly Balance</div>
            <div style={{ fontSize:12, color:'var(--t3)', marginTop:2 }}>{mLabel}</div>
          </div>
          {deficit > 0
            ? <span style={{ padding:'4px 10px', background:'var(--redl)', border:'1px solid rgba(248,81,73,.3)', borderRadius:999, fontSize:11, color:'var(--red)', fontWeight:600, whiteSpace:'nowrap' }}>Drawing from savings</span>
            : credit > 0
              ? <span style={{ padding:'4px 10px', background:'var(--gl)', border:'1px solid rgba(34,197,94,.3)', borderRadius:999, fontSize:11, color:'var(--g)', fontWeight:600, whiteSpace:'nowrap' }}>On track</span>
              : null}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:20, alignItems:'center' }}>
          {/* Ring chart */}
          <div style={{ position:'relative', width:110, height:110, flexShrink:0 }}>
            <svg width="110" height="110" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={R} fill="none" stroke="var(--card2)" strokeWidth="10"/>
              <circle cx="50" cy="50" r={R} fill="none" stroke={spColor}
                strokeWidth="10" strokeDasharray={`${used} ${circ}`}
                strokeLinecap="round" transform="rotate(-90 50 50)"
                style={{ transition:'stroke-dasharray .6s ease, stroke .3s' }}/>
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <div style={{ fontSize:16, fontWeight:800, color:spColor, lineHeight:1, transition:'color .3s' }}>{Math.round(Math.min(spPct, 999))}%</div>
              <div style={{ fontSize:9, color:'var(--t3)', marginTop:2 }}>spent</div>
            </div>
          </div>

          <div style={{ minWidth:0 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6, flexWrap:'wrap', gap:4 }}>
              <span style={{ fontSize:12, color:'var(--t2)', fontWeight:500 }}>Credit (Money In)</span>
              <span style={{ fontSize:15, fontWeight:700, color:'var(--g)' }}>{fmt(credit)}</span>
            </div>
            {credit === 0 && (
              <div style={{ fontSize:11, color:'var(--t3)', marginBottom:8 }}>
                {mi ? 'Add a transaction to trigger salary' : 'No money received this month'}
              </div>
            )}

            <div style={{ height:8, background:'var(--card2)', borderRadius:4, overflow:'hidden', marginBottom:8, position:'relative' }}>
              <div style={{ height:'100%', background:spColor, borderRadius:4, width:Math.min(100, spPct)+'%', transition:'width .6s ease, background .3s' }}/>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <div>
                <div style={{ fontSize:11, color:'var(--t3)' }}>Debit (Spent)</div>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--red)' }}>{fmt(debit)}</div>
              </div>
              <div>
                <div style={{ fontSize:11, color:'var(--t3)' }}>{deficit > 0 ? 'Overspent' : 'Remaining'}</div>
                <div style={{ fontSize:14, fontWeight:700, color:deficit > 0 ? 'var(--red)' : 'var(--g)' }}>
                  {deficit > 0 ? fmt(deficit) : fmt(remaining)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid var(--brd)', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          <div>
            <div style={{ fontSize:11, color:'var(--t3)', marginBottom:2 }}>Carried in</div>
            <div style={{ fontSize:13, fontWeight:700, color:prevBal >= 0 ? 'var(--blu)' : 'var(--red)' }}>{fmt(prevBal)}</div>
            <div style={{ fontSize:10, color:'var(--t3)' }}>from prev month</div>
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--t3)', marginBottom:2 }}>{deficit > 0 ? 'Drawn' : 'Added'}</div>
            <div style={{ fontSize:13, fontWeight:700, color:deficit > 0 ? 'var(--red)' : 'var(--g)' }}>
              {deficit > 0 ? '- '+fmt(deficit) : '+ '+fmt(remaining)}
            </div>
            <div style={{ fontSize:10, color:'var(--t3)' }}>{deficit > 0 ? 'from savings' : 'to savings'}</div>
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--t3)', marginBottom:2 }}>Closing</div>
            <div style={{ fontSize:13, fontWeight:700, color:closingBal >= 0 ? 'var(--blu)' : 'var(--red)' }}>{fmt(closingBal)}</div>
            <div style={{ fontSize:10, color:'var(--t3)' }}>cumulative</div>
          </div>
        </div>
      </div>

      <div className="g4" style={{ marginBottom:14 }}>
        {[
          { l:'Savings Rate',    v: savingsRate !== null && savingsRate !== undefined && credit > 0 ? savingsRate+'%' : '—', c: savingsRate >= 20 ? 'var(--g)' : savingsRate > 0 ? 'var(--amb)' : 'var(--t3)' },
          { l:'Portfolio Value', v: ov?.portfolioValue ? fmt(ov.portfolioValue) : '—', c:'var(--g)', link:'/investments' },
          { l:'Goals Progress',  v: ov?.totalGoals ? ov.completedGoals+'/'+ov.totalGoals : '—', c:'var(--amb)', link:'/goals' },
          { l:'Active Budgets',  v: ov?.activeBudgets ?? '—', c:'var(--t1)', link:'/budgets' },
        ].map(s => (
          <div key={s.l} className="sc" style={{ textAlign:'center', cursor:s.link?'pointer':undefined }} onClick={() => s.link && nav(s.link)}>
            <div style={{ fontSize:18, fontWeight:700, color:s.c, marginBottom:4 }}>{s.v}</div>
            <div className="sl">{s.l}</div>
          </div>
        ))}
      </div>
      {tips.length > 0 && (
        <div className="card" style={{ marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:10 }}>AI Insights</div>
          <div className="ga">
            {tips.map((t, i) => (
              <div key={i} style={{ padding:'9px 11px', background:'var(--card2)', borderRadius:'var(--r2)', fontSize:12, color:'var(--t2)', lineHeight:1.55, border:'1px solid var(--brd)' }}>
                {typeof t === 'string' ? t : JSON.stringify(t)}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="g2" style={{ marginBottom:14 }}>
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <span style={{ fontSize:13, fontWeight:600 }}>Top Expenses</span>
            <button onClick={() => nav('/charts')} style={{ background:'none', border:'none', fontSize:11, color:'var(--g)', cursor:'pointer', fontFamily:'inherit' }}>Analytics →</button>
          </div>
          {(ov?.topCats||[]).length > 0 ? ov.topCats.map(({ cat, total }) => (
            <div key={cat} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:9 }}>
              <span style={{ fontSize:14, flexShrink:0 }}>{CI[cat]||'📦'}</span>
              <span style={{ fontSize:12, fontWeight:500, width:80, flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--t2)' }}>{cat}</span>
              <div style={{ flex:1, height:4, background:'var(--card2)', borderRadius:2, overflow:'hidden', minWidth:0 }}>
                <div style={{ height:'100%', background:CC[cat]||'#94a3b8', width:(debit > 0 ? Math.min(100,total/debit*100) : 0)+'%', borderRadius:2, transition:'width .5s' }}/>
              </div>
              <span style={{ fontSize:12, fontWeight:600, minWidth:62, textAlign:'right', color:'var(--t2)', flexShrink:0 }}>{fmt(total)}</span>
            </div>
          )) : <p style={{ fontSize:12, color:'var(--t3)', textAlign:'center', padding:'16px 0' }}>No expenses this month.</p>}
        </div>

        {/* Summary */}
        <div className="card">
          <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>This Month</div>
          {credit > 0 ? (
            <>
              {[
                { c:'var(--g)',    l:'Credit (Money In)',   v:fmt(credit) },
                { c:'var(--red)', l:'Debit (Spent)',        v:fmt(debit) },
                { c:deficit > 0 ? 'var(--red)' : 'var(--g)', l:deficit > 0 ? 'Overspent' : 'Remaining', v:deficit > 0 ? fmt(deficit) : fmt(remaining) },
                { c:closingBal >= 0 ? 'var(--blu)' : 'var(--red)', l:'Cumulative savings', v:fmt(closingBal) },
              ].map(b => (
                <div key={b.l} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, marginBottom:8, flexWrap:'wrap' }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:b.c, display:'block', flexShrink:0 }}/>
                  <span style={{ color:'var(--t2)', flex:1, minWidth:80 }}>{b.l}</span>
                  <strong style={{ color:b.c }}>{b.v}</strong>
                </div>
              ))}
              {deficit > 0 && (
                <div style={{ marginTop:8, padding:'8px 10px', background:'var(--ambl)', borderRadius:'var(--r2)', fontSize:11, color:'var(--amb)', lineHeight:1.5 }}>
                  Spending exceeds income by {fmt(deficit)}.
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign:'center', padding:'18px 0' }}>
              <p style={{ fontSize:12, color:'var(--t3)', marginBottom:10 }}>No income recorded yet.</p>
              <button className="btn bp bsm" onClick={() => nav('/prof')}>{mi ? 'View Profile' : 'Set Salary'}</button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <span style={{ fontSize:13, fontWeight:600 }}>Recent Transactions</span>
          <button onClick={() => nav('/tx')} style={{ background:'none', border:'none', fontSize:11, color:'var(--g)', cursor:'pointer', fontFamily:'inherit' }}>View all →</button>
        </div>
        {(ov?.recent||[]).length > 0 ? ov.recent.map(t => (
          <div key={t._id} style={{ display:'flex', alignItems:'center', gap:9, padding:'7px 6px', borderRadius:'var(--r1)', marginBottom:1, transition:'background var(--tr)' }}
            onMouseEnter={e=>e.currentTarget.style.background='var(--card2)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <div style={{ width:30, height:30, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0, background:(CC[t.cat]||'#94a3b8')+'22' }}>
              {t.src==='salary'?'💼':t.type==='credit'?'📥':'📤'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {t.desc}
                {t.src==='salary'&&<span style={{ marginLeft:6, fontSize:9, background:'var(--gl)', color:'var(--g)', padding:'1px 5px', borderRadius:3, fontWeight:700 }}>AUTO</span>}
              </div>
              <div style={{ fontSize:11, color:'var(--t3)', marginTop:1 }}>{t.cat} · {relD(t.date)}</div>
            </div>
            <div style={{ fontSize:12, fontWeight:700, flexShrink:0, color:t.type==='credit'?'var(--g)':'var(--red)' }}>
              {t.type==='credit'?'+':'−'}{fmt(t.amount)}
            </div>
          </div>
        )) : (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <p style={{ fontSize:12, color:'var(--t3)', marginBottom:8 }}>No transactions yet.</p>
            <button className="btn bp bsm" onClick={() => nav('/add')}>Add first transaction</button>
          </div>
        )}
      </div>
    </div>
  );
}
