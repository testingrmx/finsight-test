import { useState, useEffect } from 'react';
import { A } from '../services/api.js';
import { fmt, nowYM, ymLabel, CATS } from '../utils/h.js';
import { toast } from '../components/ui/Toast.jsx';

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(); d.setMonth(d.getMonth() - i);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
});

const STATUS = {
  on_track:  { label:'On Track',   barColor:'var(--g)',   textColor:'var(--g)',   bg:'var(--gl)' },
  warning:   { label:'Careful',    barColor:'var(--amb)', textColor:'var(--amb)', bg:'var(--ambl)' },
  fully_used:{ label:'Fully Used', barColor:'var(--amb)', textColor:'var(--amb)', bg:'var(--ambl)' },
  exceeded:  { label:'Exceeded',   barColor:'var(--red)', textColor:'var(--red)', bg:'var(--redl)' },
};

const INIT = { category:'', allocatedAmount:'', month: nowYM() };

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [busy,    setBusy]    = useState(true);
  const [month,   setMonth]   = useState(nowYM());
  const [open,    setOpen]    = useState(false);
  const [edit,    setEdit]    = useState(null);
  const [form,    setForm]    = useState(INIT);
  const [saving,  setSaving]  = useState(false);
  const [delId,   setDelId]   = useState(null);

  const load = async m => {
    setBusy(true);
    try { const { data } = await A.budgetList({ month: m || month }); setBudgets(data); }
    catch { toast.err('Failed to load budgets.'); }
    finally { setBusy(false); }
  };

  useEffect(() => { load(month); }, [month]);

  const openAdd  = () => { setEdit(null); setForm({ ...INIT, month }); setOpen(true); };
  const openEdit = b => { setEdit(b); setForm({ category: b.category, allocatedAmount: b.allocatedAmount, month: b.month }); setOpen(true); };
  const closeForm = () => { setOpen(false); setEdit(null); };

  const save = async () => {
    if (!form.category) { toast.err('Select a category.'); return; }
    if (!form.allocatedAmount || +form.allocatedAmount < 1) { toast.err('Enter a valid amount.'); return; }
    setSaving(true);
    try {
      if (edit) {
        const { data } = await A.budgetUpdate(edit.id, { allocatedAmount: +form.allocatedAmount });
        setBudgets(p => p.map(b => b.id === edit.id ? data : b));
        toast.ok('Budget updated.');
      } else {
        const { data } = await A.budgetCreate({ ...form, allocatedAmount: +form.allocatedAmount });
        setBudgets(p => [...p, data]);
        toast.ok('Budget created.');
      }
      closeForm();
    } catch (e) { toast.err(e.response?.data?.error || 'Failed.'); }
    finally { setSaving(false); }
  };

  const del = async id => {
    if (!confirm('Delete this budget?')) return;
    setDelId(id);
    try { await A.budgetDel(id); setBudgets(p => p.filter(b => b.id !== id)); toast.ok('Deleted.'); }
    catch { toast.err('Failed to delete.'); }
    finally { setDelId(null); }
  };

  const totalAllocated = budgets.reduce((s, b) => s + b.allocatedAmount, 0);
  const totalSpent     = budgets.reduce((s, b) => s + b.spentAmount, 0);
  const exceeded       = budgets.filter(b => b.status === 'exceeded').length;

  const inp = { padding:'9px 12px', background:'var(--inp)', border:'1px solid var(--brd)', borderRadius:'var(--r2)', fontSize:13, color:'var(--t1)', outline:'none', fontFamily:'inherit', width:'100%' };

  return (
    <div className="fade" style={{ width:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <select value={month} onChange={e => setMonth(e.target.value)}
          style={{ ...inp, width:'auto', cursor:'pointer' }}>
          {MONTHS.map(m => <option key={m} value={m}>{ymLabel(m)}</option>)}
        </select>
        <button className="btn bp" onClick={openAdd}>+ Add Budget</button>
      </div>

      <div className="g3" style={{ marginBottom:14 }}>
        {[
          { l:'Total Allocated', v:fmt(totalAllocated),    c:'var(--t1)' },
          { l:'Total Spent',     v:fmt(totalSpent),         c: totalSpent > totalAllocated ? 'var(--red)' : 'var(--g)' },
          { l:'Budgets Exceeded',v:exceeded,                c: exceeded > 0 ? 'var(--red)' : 'var(--g)' },
        ].map(s => (
          <div key={s.l} className="sc" style={{ textAlign:'center' }}>
            <div style={{ fontSize:20, fontWeight:700, color:s.c }}>{s.v}</div>
            <div className="sl">{s.l}</div>
          </div>
        ))}
      </div>

      {exceeded > 0 && (
        <div className="al ar" style={{ marginBottom:14 }}>
          {exceeded} budget{exceeded > 1 ? 's' : ''} exceeded this month. Review your spending.
        </div>
      )}

      {busy ? (
        <div className="spc"><div className="spin" style={{ width:28, height:28 }}/></div>
      ) : budgets.length === 0 ? (
        <div className="empty">
          <div className="empty-icon" style={{ fontSize:32 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
          </div>
          <div className="empty-title">No budgets for {ymLabel(month)}</div>
          <div className="empty-sub">Set monthly budgets per category to track spending limits.</div>
          <button className="btn bp bsm" style={{ marginTop:10 }} onClick={openAdd}>Create First Budget</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {budgets.map(b => {
            const st = STATUS[b.status];
            return (
              <div key={b.id} className="card" style={{ border: b.status === 'exceeded' ? '1px solid rgba(248,81,73,.4)' : '1px solid var(--brd)' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:'var(--t1)', marginBottom:3 }}>{b.category}</div>
                    <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:999, background:st.bg, color:st.textColor }}>{st.label}</span>
                  </div>
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button onClick={() => openEdit(b)} className="bico" title="Edit">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => del(b.id)} disabled={delId===b.id} className="bico" title="Delete"
                      style={{ color:'var(--t3)' }} onMouseEnter={e=>e.currentTarget.style.color='var(--red)'} onMouseLeave={e=>e.currentTarget.style.color='var(--t3)'}>
                      {delId===b.id ? <span className="spin" style={{ width:12, height:12 }}/> : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>}
                    </button>
                  </div>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--t2)', marginBottom:6 }}>
                  <span>Spent: <strong style={{ color:st.textColor }}>{fmt(b.spentAmount)}</strong></span>
                  <span>Limit: <strong>{fmt(b.allocatedAmount)}</strong></span>
                  <span>Remaining: <strong style={{ color: b.remainingAmount < 0 ? 'var(--red)' : 'var(--g)' }}>{fmt(b.remainingAmount)}</strong></span>
                </div>
                <div style={{ height:6, background:'var(--card2)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:st.barColor, borderRadius:3, width:Math.min(100, b.percentageUsed)+'%', transition:'width .5s' }}/>
                </div>
                <div style={{ fontSize:11, color:'var(--t3)', marginTop:4, textAlign:'right' }}>{b.percentageUsed.toFixed(1)}% used</div>
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <div style={{ position:'fixed', inset:0, background:'rgba(1,4,9,.75)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={closeForm}>
          <div style={{ background:'var(--card)', border:'1px solid var(--brd)', borderRadius:'var(--r3)', padding:22, maxWidth:420, width:'100%' }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
              <h3 style={{ fontSize:14, fontWeight:700 }}>{edit ? 'Edit Budget' : 'New Budget'}</h3>
              <button onClick={closeForm} className="bico" style={{ fontSize:20 }}>x</button>
            </div>
            {!edit && (
              <div className="fld">
                <label className="lbl">Category</label>
                <select style={{ ...inp, cursor:'pointer' }} value={form.category} onChange={e => setForm(p => ({ ...p, category:e.target.value }))}>
                  <option value="">Select category</option>
                  {CATS.filter(c => c !== 'Savings').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            {edit && <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>Category: {edit.category}</div>}
            <div className="fld">
              <label className="lbl">Monthly Limit (Rs.)</label>
              <input style={inp} type="number" min="1" placeholder="e.g. 5000"
                value={form.allocatedAmount} onChange={e => setForm(p => ({ ...p, allocatedAmount:e.target.value }))} onKeyDown={e => e.key==='Enter' && save()}/>
            </div>
            {!edit && (
              <div className="fld">
                <label className="lbl">Month</label>
                <select style={{ ...inp, cursor:'pointer' }} value={form.month} onChange={e => setForm(p => ({ ...p, month:e.target.value }))}>
                  {MONTHS.slice(0,3).map(m => <option key={m} value={m}>{ymLabel(m)}</option>)}
                </select>
              </div>
            )}
            <div style={{ display:'flex', gap:10, marginTop:4 }}>
              <button className="btn bp bfw" style={{ padding:'9px' }} onClick={save} disabled={saving}>
                {saving ? 'Saving...' : (edit ? 'Update' : 'Create Budget')}
              </button>
              <button className="btn bg" onClick={closeForm}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
