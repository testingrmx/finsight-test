import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { A } from '../services/api.js';
import { fmt, fmtD, CC, CI, CATS, dAgo, today, TYPE_COLOR } from '../utils/h.js';
import { toast } from '../components/ui/Toast.jsx';

const TYPE_LABEL = { credit:'Credit (Money In)', debit:'Debit (Money Out)' };

const CI2 = (t, cat, src) => {
  if (src === 'salary') return '💼';
  if (t === 'credit')   return '📥';
  return CI[cat] || '📦';
};

export default function Tx() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [busy,  setBusy]  = useState(true);
  const [q,     setQ]     = useState('');
  const [ft,    setFt]    = useState('all');
  const [fc,    setFc]    = useState('all');
  const [from,  setFrom]  = useState(dAgo(30));
  const [to,    setTo]    = useState(today());
  const [delId, setDelId] = useState(null);

  const load = async () => {
    setBusy(true);
    try {
      const p = { from, to, limit: 500 };
      if (ft !== 'all') p.type = ft;
      if (fc !== 'all') p.cat  = fc;
      const { data } = await A.txList(p);
      setItems(data.items || []);
    } catch { toast.err('Failed to load.'); }
    finally { setBusy(false); }
  };

  useEffect(() => { load(); }, [from, to, ft, fc]);

  const del = async id => {
    if (!confirm('Delete this transaction?')) return;
    setDelId(id);
    try { await A.txDel(id); setItems(p => p.filter(t => t._id !== id)); toast.ok('Deleted.'); }
    catch { toast.err('Failed to delete.'); }
    finally { setDelId(null); }
  };

  const filtered = items.filter(t =>
    !q || t.desc.toLowerCase().includes(q.toLowerCase()) || (t.cat||'').toLowerCase().includes(q.toLowerCase())
  );

  // Summary totals for the selected period — credit/debit only
  const totCredit = filtered.filter(t => t.type === 'credit').reduce((s,t) => s+t.amount, 0);
  const totDebit  = filtered.filter(t => t.type === 'debit').reduce((s,t) => s+t.amount, 0);
  const net       = totCredit - totDebit;

  const selStyle = {
    padding:'8px 10px', background:'var(--card)', border:'1px solid var(--brd)',
    borderRadius:'var(--r2)', fontSize:13, color:'var(--t1)', outline:'none',
    cursor:'pointer', fontFamily:'inherit',
  };

  return (
    <div className="fade" style={{ width:'100%' }}>

      {/* ── Filters ── */}
      <div className="filter-row">
        <div className="filter-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--t3)', pointerEvents:'none', zIndex:1 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input style={{ ...selStyle, width:'100%', paddingLeft:32 }} placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)}/>
        </div>
        <select style={{ ...selStyle, flex:'1 1 110px' }} value={ft} onChange={e=>setFt(e.target.value)}>
          <option value="all">All types</option>
          <option value="credit">Credit (Money In)</option>
          <option value="debit">Debit (Money Out)</option>
        </select>
        <select style={{ ...selStyle, flex:'1 1 120px' }} value={fc} onChange={e=>setFc(e.target.value)}>
          <option value="all">All categories</option>
          {CATS.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <input style={{ ...selStyle, flex:'1 1 110px', cursor:'pointer' }} type="date" value={from} onChange={e=>setFrom(e.target.value)}/>
        <input style={{ ...selStyle, flex:'1 1 110px', cursor:'pointer' }} type="date" value={to}   onChange={e=>setTo(e.target.value)}/>
        <button className="btn bp bsm" onClick={()=>nav('/add')}>+ Add</button>
      </div>

      {/* ── Summary boxes ── Credit | Debit | Net ── */}
      <div className="g3" style={{ marginBottom:14 }}>
        {[
          { l:'Total Credit',  v: '+'+fmt(totCredit), c:'var(--g)',   hint:'All money received' },
          { l:'Total Debit',   v: '−'+fmt(totDebit),  c:'var(--red)', hint:'All money spent' },
          { l:'Net',           v: fmt(net),            c: net>=0?'var(--blu)':'var(--red)', hint:'Credit − Debit' },
        ].map(s=>(
          <div key={s.l} className="sc" style={{ textAlign:'center', padding:'14px 12px' }}>
            <div style={{ fontSize:18, fontWeight:700, color:s.c, letterSpacing:'-.5px', fontVariantNumeric:'tabular-nums' }}>{s.v}</div>
            <div className="sl">{s.l}</div>
            <div style={{ fontSize:10, color:'var(--t3)', marginTop:3 }}>{s.hint}</div>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      {busy ? (
        <div className="spc"><div className="spin" style={{ width:28, height:28 }}/></div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">No transactions found</div>
          <div className="empty-sub">Try adjusting filters or date range.</div>
          <button className="btn bp bsm" style={{ marginTop:8 }} onClick={()=>nav('/add')}>+ Add Transaction</button>
        </div>
      ) : (
        <div className="tbl-wrap">
          <div className="th" style={{ gridTemplateColumns:'2.5fr 1fr 1fr 1fr 36px', gap:8 }}>
            <span>Description</span><span>Category</span><span>Date</span><span style={{ textAlign:'right' }}>Amount</span><span/>
          </div>
          {filtered.map(t => (
            <div key={t._id} className="tr" style={{ gridTemplateColumns:'2.5fr 1fr 1fr 1fr 36px', gap:8, alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                <div style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0,
                  background:(CC[t.cat]||'#94a3b8')+'22', color:CC[t.cat]||'#94a3b8' }}>
                  {CI2(t.type, t.cat, t.src)}
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--t1)' }}>{t.desc}</div>
                  <div style={{ display:'flex', gap:4, marginTop:1 }}>
                    {t.src==='import' && <span style={{ fontSize:9, background:'var(--blul)', color:'var(--blu)', padding:'1px 5px', borderRadius:3, fontWeight:600 }}>IMPORTED</span>}
                    {t.src==='salary' && <span style={{ fontSize:9, background:'var(--gl)', color:'var(--g)', padding:'1px 5px', borderRadius:3, fontWeight:600 }}>AUTO</span>}
                    {t.src==='salary' && <span style={{ fontSize:9, background:'var(--gl)', color:'var(--g)', padding:'1px 5px', borderRadius:3, fontWeight:700 }}>AUTO</span>}
                    {t.src==='import' && <span style={{ fontSize:9, background:'var(--blul)', color:'var(--blu)', padding:'1px 5px', borderRadius:3, fontWeight:600 }}>IMP</span>}
                  </div>
                </div>
              </div>
              <div>
                <span style={{ fontSize:12, padding:'3px 8px', borderRadius:999, background:(CC[t.cat]||'#94a3b8')+'18', color:CC[t.cat]||'#94a3b8', fontWeight:500 }}>{t.cat}</span>
              </div>
              <div style={{ fontSize:12, color:'var(--t2)' }}>{fmtD(t.date)}</div>
              <div style={{ fontSize:13, fontWeight:700, textAlign:'right', color: t.type==='credit'?'var(--g)':'var(--red)' }}>
                {t.type==='credit'?'+':'−'}{fmt(t.amount)}
              </div>
              <button onClick={()=>del(t._id)} disabled={!!delId}
                style={{ background:'none', border:'none', cursor:'pointer', color:'var(--t3)', padding:4, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:4, transition:'color .15s' }}
                title="Delete transaction"
                onMouseEnter={e=>e.currentTarget.style.color='var(--red)'}
                onMouseLeave={e=>e.currentTarget.style.color='var(--t3)'}>
                {delId===t._id
                  ? <span className="spin" style={{ width:12, height:12 }}/>
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>}
              </button>
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize:11, color:'var(--t3)', textAlign:'right', marginTop:6 }}>
        {filtered.length} transaction{filtered.length!==1?'s':''}
      </div>
    </div>
  );
}
