import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { A } from '../services/api.js';
import { useAuth } from '../context/Auth.jsx';
import { toast } from '../components/ui/Toast.jsx';
import { safeDate } from '../utils/h.js';

export default function Profile() {
  const { user, setU, logout } = useAuth();
  const nav    = useNavigate();
  const avRef  = useRef(null);

  const [name,      setName]      = useState(user?.name || '');
  const [phone,     setPhone]     = useState(user?.phone || '');
  const [income,    setIncome]    = useState(user?.monthlyIncome || '');
  const [paused,    setPaused]    = useState(user?.salaryPaused || false);
  const [saving,    setSaving]    = useState(false);
  const [avPrev,    setAvPrev]    = useState(user?.avatar || null);
  const [avBusy,    setAvBusy]    = useState(false);
  const [pwOpen,    setPwOpen]    = useState(false);
  const [curPw,     setCurPw]     = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [newPw2,    setNewPw2]    = useState('');
  const [pwBusy,    setPwBusy]    = useState(false);
  const [delOpen,   setDelOpen]   = useState(false);
  const [delPw,     setDelPw]     = useState('');
  const [delBusy,   setDelBusy]   = useState(false);
  const [salaryTab, setSalaryTab] = useState('set');
  const [existingMonths, setExistingMonths] = useState([]);

  useEffect(() => {
    A.salaryMonths().then(({ data }) => setExistingMonths(data.months || [])).catch(() => {});
  }, []);

  const handlePhoto = e => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 5*1024*1024) { toast.err('Image must be under 5 MB.'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = 200; canvas.height = 200;
        canvas.getContext('2d').drawImage(img,(img.width-size)/2,(img.height-size)/2,size,size,0,0,200,200);
        const b64 = canvas.toDataURL('image/jpeg', 0.85);
        setAvBusy(true);
        A.profile({ avatar:b64 })
          .then(({ data }) => { setU(data.user); setAvPrev(b64); toast.ok('Photo updated.'); })
          .catch(e => toast.err(e.response?.data?.error || 'Upload failed.'))
          .finally(() => setAvBusy(false));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeAvatar = () => {
    setAvBusy(true);
    A.profile({ avatar:null })
      .then(({ data }) => { setU(data.user); setAvPrev(null); toast.ok('Photo removed.'); })
      .catch(() => toast.err('Failed.'))
      .finally(() => setAvBusy(false));
  };

  const save = async () => {
    if (!name.trim() || name.trim().length < 2) { toast.err('Name must be at least 2 characters.'); return; }
    if (income && (+income < 1 || +income > 10000000)) { toast.err('Enter a valid salary amount.'); return; }
    setSaving(true);
    try {
      const payload = { name: name.trim() };
      if (phone.trim() !== (user?.phone || '')) payload.phone = phone.trim() || null;
      if (String(income) !== String(user?.monthlyIncome || '')) payload.monthlyIncome = income ? +income : null;
      if (paused !== (user?.salaryPaused || false)) payload.salaryPaused = paused;
      const { data } = await A.profile(payload);
      setU(data.user);
      toast.ok('Saved.');
    } catch (e) { toast.err(e.response?.data?.error || 'Save failed.'); }
    finally { setSaving(false); }
  };

  const togglePause = async () => {
    const np = !paused;
    setSaving(true);
    try {
      const { data } = await A.profile({ salaryPaused: np });
      setU(data.user); setPaused(np);
      toast.ok(np ? 'Salary paused.' : 'Salary resumed.');
    } catch (e) { toast.err(e.response?.data?.error || 'Failed.'); }
    finally { setSaving(false); }
  };

  const clearSalary = async () => {
    if (!confirm('Remove salary? Past salary transactions are kept.')) return;
    setSaving(true);
    try {
      const { data } = await A.profile({ monthlyIncome: null, salaryPaused: false });
      setU(data.user); setIncome(''); setPaused(false);
      toast.ok('Salary removed.');
    } catch (e) { toast.err(e.response?.data?.error || 'Failed.'); }
    finally { setSaving(false); }
  };

  const deleteSalaryMonth = async ym => {
    if (!confirm(`Delete auto-added salary for ${ym}?`)) return;
    try {
      await A.delSalaryMonth(ym);
      setExistingMonths(p => p.filter(m => m !== ym));
      toast.ok(`Salary for ${ym} deleted.`);
    } catch (e) { toast.err(e.response?.data?.error || 'Failed.'); }
  };

  const doChangePw = async () => {
    if (!curPw || !newPw || newPw.length < 8) { toast.err('Fill all fields. Min 8 chars.'); return; }
    if (newPw !== newPw2) { toast.err('Passwords do not match.'); return; }
    setPwBusy(true);
    try { await A.changePw({ currentPassword:curPw, newPassword:newPw }); toast.ok('Password changed.'); setPwOpen(false); setCurPw(''); setNewPw(''); setNewPw2(''); }
    catch (e) { toast.err(e.response?.data?.error || 'Failed.'); }
    finally { setPwBusy(false); }
  };

  const doDelete = async () => {
    if (!delPw) { toast.err('Enter your password.'); return; }
    setDelBusy(true);
    try { await A.delAcct({ password:delPw }); logout(); nav('/login'); }
    catch (e) { toast.err(e.response?.data?.error || 'Incorrect password.'); }
    finally { setDelBusy(false); }
  };

  const inp = { padding:'9px 12px', background:'var(--inp)', border:'1px solid var(--brd)', borderRadius:'var(--r2)', fontSize:14, color:'var(--t1)', outline:'none', fontFamily:'inherit', width:'100%' };

  return (
    <>
    <div className="fade prof-grid">
      <div style={{ display:'flex', flexDirection:'column', gap:16, alignSelf:'stretch' }}>
        <div className="card" style={{ display:'flex', flexDirection:'column', gap:14, flex:1 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.07em' }}>Account</div>

          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--brd)' }}>
            <div onClick={() => !avBusy && avRef.current?.click()}
              style={{ width:88, height:88, borderRadius:'50%', cursor:avBusy?'default':'pointer', background:'linear-gradient(135deg,var(--g),var(--gd))', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:30, fontWeight:700, overflow:'hidden', border:'3px solid var(--brd)' }}>
              {avBusy ? <span className="spin" style={{ width:24,height:24,borderTopColor:'#fff' }}/>
                : avPrev ? <img src={avPrev} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                : (user?.name?.[0]?.toUpperCase()||'U')}
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={() => avRef.current?.click()} disabled={avBusy} className="btn bg bsm">{avPrev?'Change':'Upload Photo'}</button>
              {avPrev && <button onClick={removeAvatar} disabled={avBusy} style={{ padding:'5px 10px', background:'transparent', color:'var(--red)', border:'1px solid rgba(248,81,73,.4)', borderRadius:'var(--r2)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Remove</button>}
            </div>
            <p style={{ fontSize:10, color:'var(--t3)' }}>JPG/PNG/WEBP, max 5 MB</p>
            <input ref={avRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhoto}/>
          </div>

          <div className="fld">
            <label className="lbl">Full Name</label>
            <input style={inp} value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key==='Enter'&&save()}/>
          </div>
          <div className="fld">
            <label className="lbl">Email</label>
            <input style={{ ...inp, opacity:.5 }} value={user?.email||''} disabled/>
            <p className="hint">Cannot be changed after verification.</p>
          </div>
          <div className="fld">
            <label className="lbl">Phone <span style={{ color:'var(--t3)', fontWeight:400, fontSize:11 }}>optional</span></label>
            <input style={inp} type="tel" placeholder="e.g. 9876543210" value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key==='Enter'&&save()}/>
            <p className="hint">Used only for your reference. Not verified or shared.</p>
          </div>

          <button className="btn bp bfw" onClick={save} disabled={saving} style={{ padding:'10px' }}>
            {saving?'Saving...':'Save Changes'}
          </button>
          <button onClick={() => setPwOpen(true)} className="btn bg bfw" style={{ padding:'9px' }}>Change Password</button>
          <button onClick={() => { logout(); nav('/login'); }}
            style={{ width:'100%', padding:'9px', background:'transparent', border:'1px solid var(--brd)', borderRadius:'var(--r2)', color:'var(--t2)', fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontFamily:'inherit', transition:'all .13s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--red)'; e.currentTarget.style.color='var(--red)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--brd)'; e.currentTarget.style.color='var(--t2)'; }}>
            Sign Out
          </button>
        </div>
      </div>

      <div className="prof-right">
        <div className="card">
          <div style={{ fontSize:11, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:14 }}>Salary Management</div>

          <div style={{ display:'flex', gap:2, marginBottom:14, background:'var(--card2)', borderRadius:'var(--r2)', padding:3 }}>
            {[['set','Set / Update'],['manage','Manage Months']].map(([id,l]) => (
              <button key={id} onClick={() => setSalaryTab(id)}
                style={{ flex:1, padding:'7px', border:'none', borderRadius:6, background:salaryTab===id?'var(--card)':'transparent', color:salaryTab===id?'var(--t1)':'var(--t2)', fontWeight:salaryTab===id?600:400, fontSize:13, cursor:'pointer', fontFamily:'inherit', transition:'all .13s', boxShadow:salaryTab===id?'var(--s1)':'none' }}>
                {l}
              </button>
            ))}
          </div>

          {salaryTab === 'set' && (
            <>
              {paused && <div className="al aw" style={{ marginBottom:12, fontSize:12 }}>Salary auto-add is paused. No salary added to new months until resumed.</div>}
              <div className="fld">
                <label className="lbl">
                  Monthly Salary (Rs.)
                  {user?.monthlyIncome && !paused && <span style={{ marginLeft:6, fontSize:10, color:'var(--g)', fontWeight:500 }}>auto-added 1st each month</span>}
                  {paused && <span style={{ marginLeft:6, fontSize:10, color:'var(--amb)', fontWeight:500 }}>paused</span>}
                </label>
                <input style={inp} type="number" min="1" max="10000000" placeholder="e.g. 45000"
                  value={income} onChange={e => setIncome(e.target.value)} disabled={paused}/>
                <p className="hint">
                  {paused ? 'Resume salary to re-enable auto-income. Past records unchanged.' : 'Auto-added as income on the 1st of every month. Changing salary only affects current month forward.'}
                </p>
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {!paused && (
                  <button className="btn bp" style={{ flex:1, padding:'9px' }} onClick={save} disabled={saving}>
                    {saving ? 'Saving...' : (user?.monthlyIncome ? 'Update Salary' : 'Set Salary')}
                  </button>
                )}
                {user?.monthlyIncome && (
                  <button onClick={togglePause} disabled={saving} className="btn bg" style={{ flex:1, padding:'9px', fontWeight:600 }}>
                    {paused ? 'Resume Salary' : 'Pause Salary'}
                  </button>
                )}
                {user?.monthlyIncome && !paused && (
                  <button onClick={clearSalary} disabled={saving}
                    style={{ padding:'9px 12px', background:'transparent', border:'1px solid rgba(248,81,73,.4)', color:'var(--red)', borderRadius:'var(--r2)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                    Remove
                  </button>
                )}
                {paused && (
                  <button className="btn bp" style={{ flex:1, padding:'9px' }} onClick={togglePause} disabled={saving}>Resume Salary</button>
                )}
              </div>
            </>
          )}

          {salaryTab === 'manage' && (
            <>
              <p style={{ fontSize:12, color:'var(--t2)', lineHeight:1.6, marginBottom:12 }}>
                Delete auto-added salary for months where you had no income. Only removes the salary transaction — all other records are unaffected.
              </p>
              {existingMonths.length === 0 ? (
                <p style={{ fontSize:12, color:'var(--t3)', textAlign:'center', padding:'16px 0' }}>No auto-added salary months found.</p>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {existingMonths.map(ym => {
                    const [yr, mo] = ym.split('-');
                    const label = new Date(parseInt(yr), parseInt(mo)-1, 1).toLocaleString('en-IN', { month:'long', year:'numeric' });
                    return (
                      <div key={ym} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', background:'var(--card2)', borderRadius:'var(--r2)', border:'1px solid var(--brd)' }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'var(--t1)' }}>{label}</div>
                        <button onClick={() => deleteSalaryMonth(ym)}
                          style={{ padding:'5px 10px', background:'transparent', border:'1px solid rgba(248,81,73,.35)', color:'var(--red)', borderRadius:'var(--r2)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                          Delete
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <p style={{ fontSize:11, color:'var(--t3)', marginTop:8 }}>Only months with auto-added salary are shown here.</p>
            </>
          )}
        </div>

        <div className="card">
          <div style={{ fontSize:11, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:14 }}>Account Info</div>
          {[
            { l:'Member since', v:safeDate(user?.createdAt) },
            { l:'Email',        v:user?.email||'—' },
            { l:'Phone',        v:user?.phone||'Not Added' },
            { l:'Salary',       v:user?.monthlyIncome ? 'Rs.'+user.monthlyIncome.toLocaleString('en-IN')+'/month'+(paused?' (paused)':'') : 'Not set' },
          ].map(r => (
            <div key={r.l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13, marginBottom:10, paddingBottom:10, borderBottom:'1px solid var(--brd)' }}>
              <span style={{ color:'var(--t2)' }}>{r.l}</span>
              <span style={{ fontWeight:600, color:'var(--t1)', maxWidth:'55%', textAlign:'right', wordBreak:'break-all' }}>{r.v}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <div style={{ fontSize:11, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:14 }}>Security</div>
          {[
            { l:'Login method',     v:'OTP every login' },
            { l:'Password',         v:'bcrypt hashed'   },
            { l:'Session',          v:'7-day JWT'        },
            { l:'Login protection', v:'5 attempts max'   },
          ].map((s,i,arr) => (
            <div key={s.l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13, marginBottom:i<arr.length-1?10:0, paddingBottom:i<arr.length-1?10:0, borderBottom:i<arr.length-1?'1px solid var(--brd)':'none' }}>
              <span style={{ color:'var(--t2)' }}>{s.l}</span>
              <span style={{ fontWeight:600, color:'var(--t1)' }}>{s.v}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ border:'1px solid rgba(248,81,73,.25)' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--red)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>Danger Zone</div>
          <p style={{ fontSize:12, color:'var(--t2)', lineHeight:1.6, marginBottom:14 }}>Permanently deletes your account and all transaction data. Cannot be undone.</p>
          <button className="btn bd bsm" onClick={() => setDelOpen(true)}>Delete My Account</button>
        </div>
      </div>
    </div>

    {pwOpen && (
      <div style={{ position:'fixed', inset:0, background:'rgba(1,4,9,.75)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={() => setPwOpen(false)}>
        <div style={{ background:'var(--card)', border:'1px solid var(--brd)', borderRadius:'var(--r3)', padding:20, maxWidth:400, width:'100%' }} onClick={e=>e.stopPropagation()}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
            <h3 style={{ fontSize:14, fontWeight:700 }}>Change Password</h3>
            <button onClick={() => setPwOpen(false)} className="bico" style={{ fontSize:18 }}>&#x2715;</button>
          </div>
          <div className="fld"><label className="lbl">Current Password</label><input style={inp} type="password" placeholder="Current password" value={curPw} onChange={e=>setCurPw(e.target.value)}/></div>
          <div className="fld"><label className="lbl">New Password (min 8 chars)</label><input style={inp} type="password" placeholder="New password" value={newPw} onChange={e=>setNewPw(e.target.value)}/></div>
          <div className="fld"><label className="lbl">Confirm New Password</label><input style={inp} type="password" placeholder="Confirm" value={newPw2} onChange={e=>setNewPw2(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doChangePw()}/></div>
          <div style={{ display:'flex', gap:8, marginTop:4 }}>
            <button className="btn bp bfw" style={{ padding:'9px' }} onClick={doChangePw} disabled={pwBusy}>{pwBusy?'Changing...':'Change Password'}</button>
            <button className="btn bg" onClick={() => setPwOpen(false)}>Cancel</button>
          </div>
        </div>
      </div>
    )}

    {delOpen && (
      <div style={{ position:'fixed', inset:0, background:'rgba(1,4,9,.75)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={() => { setDelOpen(false); setDelPw(''); }}>
        <div style={{ background:'var(--card)', border:'1px solid var(--brd)', borderRadius:'var(--r3)', padding:20, maxWidth:400, width:'100%' }} onClick={e=>e.stopPropagation()}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:'var(--red)' }}>Delete Account</h3>
            <button onClick={() => { setDelOpen(false); setDelPw(''); }} className="bico" style={{ fontSize:18 }}>&#x2715;</button>
          </div>
          <div className="al ar" style={{ marginBottom:12, fontSize:12 }}>Permanently deletes everything. Cannot be undone.</div>
          <div className="fld" style={{ marginBottom:12 }}>
            <label className="lbl">Enter password to confirm</label>
            <input style={inp} type="password" placeholder="Your password" value={delPw} onChange={e=>setDelPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doDelete()}/>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn bd bfw" style={{ padding:'9px' }} onClick={doDelete} disabled={delBusy}>{delBusy?'Deleting...':'Delete Everything'}</button>
            <button className="btn bg" onClick={() => { setDelOpen(false); setDelPw(''); }}>Cancel</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
