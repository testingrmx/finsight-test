import { useState, useEffect } from 'react';
import { A } from '../services/api.js';
import { fmt, fmtD, INVESTMENT_TYPES, CHART_COLORS, today } from '../utils/h.js';
import { toast } from '../components/ui/Toast.jsx';
import Modal from '../components/ui/Modal.jsx';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const INIT = { name:'', type:'mutual_fund', investedAmount:'', currentValue:'', units:'', purchaseDate: today(), notes:'' };

const typeLabel = v => INVESTMENT_TYPES.find(t => t.value === v)?.label || v;

export default function Investments() {
  const [items,     setItems]     = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [busy,      setBusy]      = useState(true);
  const [open,      setOpen]      = useState(false);
  const [edit,      setEdit]      = useState(null);
  const [form,      setForm]      = useState(INIT);
  const [saving,    setSaving]    = useState(false);
  const [delId,     setDelId]     = useState(null);

  const load = async () => {
    setBusy(true);
    try {
      const [a, b] = await Promise.all([A.invList(), A.invPortfolio()]);
      setItems(a.data); setPortfolio(b.data);
    } catch { toast.err('Failed to load investments.'); }
    finally { setBusy(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setEdit(null); setForm(INIT); setOpen(true); };
  const openEdit = inv => {
    setEdit(inv);
    setForm({ name:inv.name, type:inv.type, investedAmount:inv.investedAmount, currentValue:inv.currentValue, units:inv.units||'', purchaseDate:inv.purchaseDate, notes:inv.notes||'' });
    setOpen(true);
  };
  const closeForm = () => { setOpen(false); setEdit(null); };

  const save = async () => {
    if (!form.name.trim())                              { toast.err('Name is required.'); return; }
    if (!form.investedAmount || +form.investedAmount < 0) { toast.err('Enter invested amount.'); return; }
    if (!form.currentValue   || +form.currentValue < 0)   { toast.err('Enter current value.'); return; }
    if (!form.purchaseDate)                             { toast.err('Purchase date required.'); return; }
    setSaving(true);
    const payload = { ...form, investedAmount:+form.investedAmount, currentValue:+form.currentValue, units:form.units?+form.units:undefined };
    try {
      if (edit) {
        const { data } = await A.invUpdate(edit.id, payload);
        setItems(p => p.map(i => i.id === edit.id ? data : i));
        toast.ok('Updated.');
      } else {
        const { data } = await A.invCreate(payload);
        setItems(p => [...p, data]);
        toast.ok('Investment added.');
      }
      await A.invPortfolio().then(r => setPortfolio(r.data));
      closeForm();
    } catch (e) { toast.err(e.response?.data?.error || 'Failed.'); }
    finally { setSaving(false); }
  };

  const del = async id => {
    if (!confirm('Delete this investment?')) return;
    setDelId(id);
    try {
      await A.invDel(id);
      setItems(p => p.filter(i => i.id !== id));
      await A.invPortfolio().then(r => setPortfolio(r.data));
      toast.ok('Deleted.');
    } catch { toast.err('Failed.'); }
    finally { setDelId(null); }
  };

  const inp = { padding:'9px 12px', background:'var(--inp)', border:'1px solid var(--brd)', borderRadius:'var(--r2)', fontSize:13, color:'var(--t1)', outline:'none', fontFamily:'inherit', width:'100%', boxSizing:'border-box' };
  const pieData = portfolio?.allocation?.map(a => ({ name: typeLabel(a.type), value: a.value })) || [];
  const gainPct = portfolio?.totalGainLossPct || 0;

  return (
    <div className="fade" style={{ width:'100%' }}>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
        <button className="btn bp" onClick={openAdd}>+ Add Investment</button>
      </div>

      {portfolio && portfolio.totalInvested > 0 && (
        <div className="g4" style={{ marginBottom:14 }}>
          {[
            { l:'Invested',      v:fmt(portfolio.totalInvested),    c:'var(--t1)' },
            { l:'Current Value', v:fmt(portfolio.totalCurrentValue), c: gainPct >= 0 ? 'var(--g)' : 'var(--red)' },
            { l:'Gain / Loss',   v:fmt(portfolio.totalGainLoss),    c: portfolio.totalGainLoss >= 0 ? 'var(--g)' : 'var(--red)' },
            { l:'Returns',       v:(gainPct >= 0 ? '+' : '')+gainPct.toFixed(2)+'%', c: gainPct >= 0 ? 'var(--g)' : 'var(--red)' },
          ].map(s => (
            <div key={s.l} className="sc" style={{ textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:700, color:s.c }}>{s.v}</div>
              <div className="sl">{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {pieData.length > 1 && (
        <div className="card" style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:10 }}>Portfolio Allocation</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
                {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]}/>)}
              </Pie>
              <Tooltip formatter={v => fmt(v)} contentStyle={{ background:'var(--card)', border:'1px solid var(--brd)', borderRadius:8, fontSize:12 }}/>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {busy ? (
        <div className="spc"><div className="spin" style={{ width:28, height:28 }}/></div>
      ) : items.length === 0 ? (
        <div className="empty">
          <div style={{ fontSize:32, opacity:.5 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          </div>
          <div className="empty-title">No investments yet</div>
          <div className="empty-sub">Track your mutual funds, stocks, FDs, PPF and more.</div>
          <button className="btn bp bsm" style={{ marginTop:10 }} onClick={openAdd}>Add First Investment</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {items.map(inv => {
            const gl = inv.gainLoss >= 0;
            return (
              <div key={inv.id} className="card" style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                    <span style={{ fontSize:13, fontWeight:600, color:'var(--t1)' }}>{inv.name}</span>
                    <span style={{ fontSize:10, padding:'1px 7px', borderRadius:999, background:'var(--blul)', color:'var(--blu)', fontWeight:600 }}>{typeLabel(inv.type)}</span>
                  </div>
                  <div style={{ fontSize:11, color:'var(--t3)' }}>Purchased {fmtD(inv.purchaseDate)}{inv.units ? ` · ${inv.units} units` : ''}</div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color: gl ? 'var(--g)' : 'var(--red)' }}>{fmt(inv.currentValue)}</div>
                  <div style={{ fontSize:11, color:'var(--t3)' }}>Invested: {fmt(inv.investedAmount)}</div>
                  <div style={{ fontSize:11, fontWeight:600, color: gl ? 'var(--g)' : 'var(--red)' }}>
                    {gl ? '+' : ''}{fmt(inv.gainLoss)} ({gl ? '+' : ''}{inv.gainLossPct.toFixed(2)}%)
                  </div>
                </div>
                <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                  <button onClick={() => openEdit(inv)} className="bico" title="Edit">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => del(inv.id)} disabled={delId===inv.id} className="bico"
                    onMouseEnter={e=>e.currentTarget.style.color='var(--red)'} onMouseLeave={e=>e.currentTarget.style.color='var(--t3)'}>
                    {delId===inv.id ? <span className="spin" style={{ width:12, height:12 }}/> : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal via Portal ── */}
      {open && (
        <Modal onClose={closeForm}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'var(--t1)' }}>{edit ? 'Edit Investment' : 'Add Investment'}</h3>
            <button onClick={closeForm} className="bico" style={{ fontSize:18 }}>&#x2715;</button>
          </div>

          <div className="fld">
            <label className="lbl">Name</label>
            <input style={inp} autoFocus placeholder="e.g. HDFC Nifty 50 Fund" value={form.name} onChange={e => setForm(p => ({ ...p, name:e.target.value }))}/>
          </div>

          <div className="fld">
            <label className="lbl">Type</label>
            <select style={{ ...inp, cursor:'pointer' }} value={form.type} onChange={e => setForm(p => ({ ...p, type:e.target.value }))}>
              {INVESTMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="fld">
              <label className="lbl">Invested (Rs.)</label>
              <input style={inp} type="number" min="0" placeholder="0" value={form.investedAmount} onChange={e => setForm(p => ({ ...p, investedAmount:e.target.value }))}/>
            </div>
            <div className="fld">
              <label className="lbl">Current Value (Rs.)</label>
              <input style={inp} type="number" min="0" placeholder="0" value={form.currentValue} onChange={e => setForm(p => ({ ...p, currentValue:e.target.value }))}/>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="fld">
              <label className="lbl">Units <span style={{ color:'var(--t3)', fontWeight:400, fontSize:11 }}>optional</span></label>
              <input style={inp} type="number" min="0" step="0.001" placeholder="0" value={form.units} onChange={e => setForm(p => ({ ...p, units:e.target.value }))}/>
            </div>
            <div className="fld">
              <label className="lbl">Purchase Date</label>
              <input style={{ ...inp, cursor:'pointer' }} type="date" value={form.purchaseDate} max={today()} onChange={e => setForm(p => ({ ...p, purchaseDate:e.target.value }))}/>
            </div>
          </div>

          <div className="fld">
            <label className="lbl">Notes <span style={{ color:'var(--t3)', fontWeight:400, fontSize:11 }}>optional</span></label>
            <textarea style={{ ...inp, resize:'none' }} rows={2} placeholder="Any details..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes:e.target.value }))}/>
          </div>

          <div style={{ display:'flex', gap:10, marginTop:4 }}>
            <button className="btn bp bfw" style={{ padding:'10px' }} onClick={save} disabled={saving}>
              {saving ? 'Saving...' : (edit ? 'Update' : 'Add Investment')}
            </button>
            <button className="btn bg" onClick={closeForm}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
