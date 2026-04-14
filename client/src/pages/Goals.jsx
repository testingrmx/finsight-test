import { useState, useEffect } from 'react';
import { A } from '../services/api.js';
import { fmt, fmtD, GOAL_CATS, today } from '../utils/h.js';
import { toast } from '../components/ui/Toast.jsx';
import Modal from '../components/ui/Modal.jsx';

const INIT = { name:'', targetAmount:'', currentAmount:'0', targetDate:'', category:'emergency_fund', description:'' };

const STATUS = {
  in_progress: { label:'In Progress', color:'var(--blu)',  bg:'var(--blul)' },
  completed:   { label:'Completed',   color:'var(--g)',   bg:'var(--gl)'  },
  overdue:     { label:'Overdue',     color:'var(--red)', bg:'var(--redl)' },
};

const catLabel = v => GOAL_CATS.find(c => c.value === v)?.label || v;

export default function Goals() {
  const [goals,    setGoals]    = useState([]);
  const [busy,     setBusy]     = useState(true);
  const [open,     setOpen]     = useState(false);
  const [edit,     setEdit]     = useState(null);
  const [form,     setForm]     = useState(INIT);
  const [saving,   setSaving]   = useState(false);
  const [delId,    setDelId]    = useState(null);
  const [contId,   setContId]   = useState(null);
  const [contAmt,  setContAmt]  = useState('');
  const [contBusy, setContBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    try { const { data } = await A.goalList(); setGoals(data); }
    catch { toast.err('Failed to load goals.'); }
    finally { setBusy(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setEdit(null); setForm(INIT); setOpen(true); };
  const openEdit = g => {
    setEdit(g);
    setForm({ name:g.name, targetAmount:g.targetAmount, currentAmount:g.currentAmount, targetDate:g.targetDate, category:g.category, description:g.description||'' });
    setOpen(true);
  };
  const closeForm = () => { setOpen(false); setEdit(null); };

  const save = async () => {
    if (!form.name.trim())                            { toast.err('Name is required.'); return; }
    if (!form.targetAmount || +form.targetAmount < 1) { toast.err('Enter a target amount.'); return; }
    if (!form.targetDate)                             { toast.err('Target date is required.'); return; }
    setSaving(true);
    const payload = { ...form, targetAmount:+form.targetAmount, currentAmount:+(form.currentAmount||0) };
    try {
      if (edit) {
        const { data } = await A.goalUpdate(edit.id, payload);
        setGoals(p => p.map(g => g.id === edit.id ? data : g));
        toast.ok('Goal updated.');
      } else {
        const { data } = await A.goalCreate(payload);
        setGoals(p => [...p, data]);
        toast.ok('Goal created.');
      }
      closeForm();
    } catch (e) { toast.err(e.response?.data?.error || 'Failed.'); }
    finally { setSaving(false); }
  };

  const del = async id => {
    if (!confirm('Delete this goal?')) return;
    setDelId(id);
    try { await A.goalDel(id); setGoals(p => p.filter(g => g.id !== id)); toast.ok('Deleted.'); }
    catch { toast.err('Failed.'); }
    finally { setDelId(null); }
  };

  const contribute = async () => {
    if (!contAmt || +contAmt <= 0) { toast.err('Enter a positive amount.'); return; }
    setContBusy(true);
    try {
      const { data } = await A.goalContribute(contId, { amount: +contAmt });
      setGoals(p => p.map(g => g.id === contId ? data : g));
      toast.ok('Contribution added.');
      setContId(null); setContAmt('');
    } catch (e) { toast.err(e.response?.data?.error || 'Failed.'); }
    finally { setContBusy(false); }
  };

  const inp = { padding:'9px 12px', background:'var(--inp)', border:'1px solid var(--brd)', borderRadius:'var(--r2)', fontSize:13, color:'var(--t1)', outline:'none', fontFamily:'inherit', width:'100%', boxSizing:'border-box' };

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved  = goals.reduce((s, g) => s + g.currentAmount, 0);
  const completed   = goals.filter(g => g.status === 'completed').length;

  return (
    <div className="fade" style={{ width:'100%' }}>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
        <button className="btn bp" onClick={openAdd}>+ New Goal</button>
      </div>

      {goals.length > 0 && (
        <div className="g3" style={{ marginBottom:14 }}>
          {[
            { l:'Total Target',    v:fmt(totalTarget), c:'var(--t1)' },
            { l:'Total Saved',     v:fmt(totalSaved),  c:'var(--g)'  },
            { l:'Goals Completed', v:`${completed}/${goals.length}`, c: completed===goals.length?'var(--g)':'var(--t1)' },
          ].map(s => (
            <div key={s.l} className="sc" style={{ textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:700, color:s.c }}>{s.v}</div>
              <div className="sl">{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {busy ? (
        <div className="spc"><div className="spin" style={{ width:28, height:28 }}/></div>
      ) : goals.length === 0 ? (
        <div className="empty">
          <div className="empty-title">No goals yet</div>
          <div className="empty-sub">Set savings goals — emergency fund, home, vacation, retirement and more.</div>
          <button className="btn bp bsm" style={{ marginTop:10 }} onClick={openAdd}>Create First Goal</button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:14 }}>
          {goals.map(g => {
            const st = STATUS[g.status];
            return (
              <div key={g.id} className="card">
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--t1)', marginBottom:4 }}>{g.name}</div>
                    <div style={{ display:'flex', gap:6 }}>
                      <span style={{ fontSize:10, padding:'1px 7px', borderRadius:999, background:'var(--card2)', color:'var(--t2)', fontWeight:500 }}>{catLabel(g.category)}</span>
                      <span style={{ fontSize:10, padding:'1px 7px', borderRadius:999, background:st.bg, color:st.color, fontWeight:600 }}>{st.label}</span>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:4 }}>
                    <button onClick={() => openEdit(g)} className="bico">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => del(g.id)} disabled={delId===g.id} className="bico"
                      onMouseEnter={e=>e.currentTarget.style.color='var(--red)'} onMouseLeave={e=>e.currentTarget.style.color='var(--t3)'}>
                      {delId===g.id ? <span className="spin" style={{ width:12,height:12 }}/> : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>}
                    </button>
                  </div>
                </div>

                {g.description && <p style={{ fontSize:12, color:'var(--t3)', marginBottom:10, lineHeight:1.5 }}>{g.description}</p>}

                <div style={{ marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--t2)', marginBottom:5 }}>
                    <span>{fmt(g.currentAmount)} saved</span>
                    <span>Target: {fmt(g.targetAmount)}</span>
                  </div>
                  <div style={{ height:6, background:'var(--card2)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:3, background:st.color, width:g.progressPercent+'%', transition:'width .5s' }}/>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--t3)', marginTop:3 }}>
                    <span>{g.progressPercent.toFixed(1)}% complete</span>
                    <span>Due: {fmtD(g.targetDate)}</span>
                  </div>
                </div>

                {g.status !== 'completed' && (() => {
                  const now = new Date();
                  const due = new Date(g.targetDate);
                  const monthsLeft = Math.max(1, Math.round((due - now) / (1000*60*60*24*30)));
                  const remaining  = g.targetAmount - g.currentAmount;
                  const reqPerMonth = remaining > 0 ? Math.ceil(remaining / monthsLeft) : 0;
                  return reqPerMonth > 0 ? (
                    <div style={{ padding:'8px 10px', background:'var(--card2)', borderRadius:'var(--r2)', marginBottom:8, fontSize:12 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', color:'var(--t2)' }}>
                        <span>Required per month</span>
                        <strong style={{ color:'var(--blu)' }}>{fmt(reqPerMonth)}</strong>
                      </div>
                      <div style={{ color:'var(--t3)', fontSize:11, marginTop:3 }}>
                        {monthsLeft} month{monthsLeft !== 1 ? 's' : ''} left · {fmt(remaining)} remaining
                      </div>
                    </div>
                  ) : null;
                })()}

                {g.status !== 'completed' && (
                  contId === g.id ? (
                    <div style={{ display:'flex', gap:8, marginTop:8 }}>
                      <input style={{ ...inp, flex:1 }} type="number" min="1" placeholder="Amount to add"
                        value={contAmt} onChange={e => setContAmt(e.target.value)} onKeyDown={e => e.key==='Enter' && contribute()} autoFocus/>
                      <button className="btn bp bsm" onClick={contribute} disabled={contBusy}>{contBusy?'...':'Add'}</button>
                      <button className="btn bg bsm" onClick={() => { setContId(null); setContAmt(''); }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setContId(g.id)} className="btn bg" style={{ width:'100%', marginTop:8, padding:'7px', fontSize:12 }}>
                      + Add Contribution
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      
      {open && (
        <Modal onClose={closeForm}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'var(--t1)' }}>{edit ? 'Edit Goal' : 'New Goal'}</h3>
            <button onClick={closeForm} className="bico" style={{ fontSize:18 }}>&#x2715;</button>
          </div>

          <div className="fld">
            <label className="lbl">Goal Name</label>
            <input style={inp} autoFocus placeholder="e.g. Emergency Fund, Goa Trip" value={form.name} onChange={e => setForm(p => ({ ...p, name:e.target.value }))} onKeyDown={e => e.key==='Enter' && save()}/>
          </div>

          <div className="fld">
            <label className="lbl">Category</label>
            <select style={{ ...inp, cursor:'pointer' }} value={form.category} onChange={e => setForm(p => ({ ...p, category:e.target.value }))}>
              {GOAL_CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="fld">
              <label className="lbl">Target Amount (Rs.)</label>
              <input style={inp} type="number" min="1" placeholder="0" value={form.targetAmount} onChange={e => setForm(p => ({ ...p, targetAmount:e.target.value }))}/>
            </div>
            <div className="fld">
              <label className="lbl">Already Saved (Rs.)</label>
              <input style={inp} type="number" min="0" placeholder="0" value={form.currentAmount} onChange={e => setForm(p => ({ ...p, currentAmount:e.target.value }))}/>
            </div>
          </div>

          <div className="fld">
            <label className="lbl">Target Date</label>
            <input style={{ ...inp, cursor:'pointer' }} type="date" value={form.targetDate} onChange={e => setForm(p => ({ ...p, targetDate:e.target.value }))}/>
          </div>

          <div className="fld">
            <label className="lbl">Description <span style={{ color:'var(--t3)', fontWeight:400, fontSize:11 }}>optional</span></label>
            <textarea style={{ ...inp, resize:'none' }} rows={2} placeholder="What this goal is for..." value={form.description} onChange={e => setForm(p => ({ ...p, description:e.target.value }))}/>
          </div>

          <div style={{ display:'flex', gap:10, marginTop:4 }}>
            <button className="btn bp bfw" style={{ padding:'10px' }} onClick={save} disabled={saving}>
              {saving ? 'Saving...' : (edit ? 'Update Goal' : 'Create Goal')}
            </button>
            <button className="btn bg" onClick={closeForm}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
