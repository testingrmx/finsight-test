import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { A } from '../services/api.js';
import { CATS, CC, CI, autoCat, today } from '../utils/h.js';
import { toast } from '../components/ui/Toast.jsx';

const INIT = { desc:'', amount:'', cat:'', type:'debit', date:today(), notes:'' };

const TYPES = [
  { key:'credit', label:'Credit (Money In)',   color:'var(--g)',   bg:'rgba(34,197,94,.12)',  hint:'Salary, income, gift, transfer in, refund' },
  { key:'debit',  label:'Debit (Money Out)',    color:'var(--red)', bg:'rgba(248,81,73,.12)',  hint:'Grocery, rent, bills, shopping, any payment' },
];

export default function Add() {
  const nav = useNavigate();
  const [tab,  setTab]  = useState('manual');
  const [f,    setF]    = useState(INIT);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState(null);
  const [imp,  setImp]  = useState(false);
  const [pct,  setPct]  = useState(0);
  const [res,  setRes]  = useState(null);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef(null);

  const set = (k, v) => setF(p => {
    const n = { ...p, [k]: v };
    if (k === 'desc' && v.length > 2) n.cat = autoCat(v);
    return n;
  });

  const validate = () => {
    if (!f.desc.trim())              { toast.err('Description is required.'); return false; }
    if (!f.amount || +f.amount < 0.01) { toast.err('Enter a valid amount greater than 0.'); return false; }
    if (f.date > today())            { toast.err('Future dates are not allowed.'); return false; }
    return true;
  };

  const save = async () => {
    if (!validate()) return;
    setBusy(true);
    try {
      await A.txCreate({ ...f, amount: +f.amount });
      toast.ok('Transaction saved successfully.');
      setF({ ...INIT, type: f.type });
    } catch (e) {
      toast.err(e.response?.data?.error || 'Save failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const pickFile = fl => {
    if (!fl) return;
    const ok = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
    if (!ok.includes(fl.type) && !fl.name.match(/\.(pdf|xlsx?|csv)$/i)) {
      toast.err('Only PDF, Excel (.xlsx), or CSV files are allowed.');
      return;
    }
    if (fl.size > 10 * 1024 * 1024) { toast.err('File too large. Max 10 MB.'); return; }
    setFile(fl);
    setRes(null);
  };

  const doImport = async () => {
    if (!file) { toast.err('Please select a file first.'); return; }
    setImp(true);
    setPct(0);
    try {
      const { data } = await A.impUpload(file, setPct);
      setRes(data);
      toast.ok(data.count + ' transactions imported successfully.');
      setFile(null);
    } catch (e) {
      toast.err(e.response?.data?.error || 'Import failed. Please try again.');
    } finally {
      setImp(false);
      setPct(0);
    }
  };

  const tc = TYPES.find(t => t.key === f.type) || TYPES[0];

  return (
    <div className="fade" style={{ width:'100%' }}>
      <style>{`
        .add-tabs{display:flex;width:100%;background:var(--card2);border:1px solid var(--brd);border-radius:var(--r2);padding:3px;gap:3px;margin-bottom:16px}
        .add-tab{flex:1;padding:10px 14px;border:none;border-radius:calc(var(--r2) - 2px);background:transparent;color:var(--t2);font-weight:500;font-size:14px;cursor:pointer;font-family:inherit;transition:all .15s;text-align:center}
        .add-tab.on{background:var(--card);color:var(--t1);font-weight:700;box-shadow:var(--s1)}
        .import-grid{display:grid;grid-template-columns:1fr 200px;gap:16px;align-items:start}
        .type-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px}
        @media(max-width:640px){
          .import-grid{grid-template-columns:1fr!important}
          .banks-col{display:none!important}
          .type-grid{grid-template-columns:1fr!important}
        }
        @media(max-width:480px){
          .add-tab{font-size:13px;padding:9px 6px}
        }
      `}</style>

      <div className="add-tabs">
        {[['manual','Manual Entry'],['import','Import Statement']].map(([id, l]) => (
          <button key={id} className={'add-tab' + (tab === id ? ' on' : '')} onClick={() => setTab(id)}>{l}</button>
        ))}
      </div>

      {tab === 'manual' && (
        <div className="card">
          {/* Type selector */}
          <div className="type-grid">
            {TYPES.map(({ key, label, color, bg, hint }) => (
              <button key={key} onClick={() => set('type', key)}
                style={{
                  padding: '14px 12px', border: '2px solid',
                  borderColor: f.type === key ? color : 'var(--brd)',
                  borderRadius: 'var(--r2)', background: f.type === key ? bg : 'transparent',
                  color: f.type === key ? color : 'var(--t3)',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  transition: 'all .13s', textAlign: 'left', lineHeight: 1.3,
                }}>
                <div>{label}</div>
                <div style={{ fontSize: 10, fontWeight: 400, opacity: .75, marginTop: 4 }}>{hint}</div>
              </button>
            ))}
          </div>

          <div style={{ height: 2, background: tc.color, borderRadius: 1, marginBottom: 18, opacity: .5 }}/>

          <div className="fld">
            <label className="lbl">Description</label>
            <input className="inp" autoFocus
              placeholder={f.type === 'credit'
                ? 'e.g. Salary, Freelance payment, Gift received, Refund'
                : 'e.g. Grocery, Petrol, Amazon order, Rent, Bill'}
              value={f.desc}
              onChange={e => set('desc', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}/>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="fld">
              <label className="lbl">Amount (₹)</label>
              <input className="inp" type="number" min="0.01" step="0.01" placeholder="0.00"
                value={f.amount}
                onChange={e => set('amount', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && save()}/>
            </div>
            <div className="fld">
              <label className="lbl">Date</label>
              <input className="inp" type="date" value={f.date} max={today()}
                onChange={e => set('date', e.target.value)} style={{ cursor: 'pointer' }}/>
            </div>
          </div>

          <div className="fld">
            <label className="lbl">Category</label>
            <div className="chip-grid">
              {CATS.map(c => (
                <button key={c} onClick={() => setF(p => ({ ...p, cat: c }))} className="chip"
                  style={{
                    borderColor: f.cat === c ? (CC[c] || 'var(--g)') : 'var(--brd)',
                    background: f.cat === c ? (CC[c] || '#22c55e') + '18' : 'transparent',
                    color: f.cat === c ? (CC[c] || 'var(--g)') : 'var(--t3)',
                    fontWeight: f.cat === c ? 600 : 400,
                  }}>
                  {CI[c]} {c}
                </button>
              ))}
            </div>
            {!f.cat && f.desc.length > 2 && (
              <p className="hint">Category auto-detected. Tap to change.</p>
            )}
          </div>

          <div className="fld">
            <label className="lbl">Notes <span style={{ color:'var(--t3)', fontWeight:400, fontSize:11 }}>optional</span></label>
            <textarea className="inp" rows={2} placeholder="Any extra details…"
              value={f.notes} onChange={e => set('notes', e.target.value)} style={{ resize: 'none' }}/>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button className="btn bp" style={{ flex: 1, padding: '11px' }} onClick={save} disabled={busy}>
              {busy
                ? <><span className="spin" style={{ width:12, height:12, borderTopColor:'#fff' }}/> Saving…</>
                : `Save ${tc.label}`}
            </button>
            <button className="btn bg" style={{ padding: '11px 20px' }} onClick={() => nav('/')}>Cancel</button>
          </div>
        </div>
      )}

      {tab === 'import' && (
        <div className="import-grid">
          <div className="card">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { t:'Formats', d:'PDF, Excel, CSV' },
                { t:'Auto-tag', d:'Smart categories' },
                { t:'Secure', d:'Files not stored' },
              ].map(x => (
                <div key={x.t} style={{ padding: '12px', background: 'var(--card2)', borderRadius: 'var(--r2)', border: '1px solid var(--brd)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{x.t}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>{x.d}</div>
                </div>
              ))}
            </div>

            <div className="al aw" style={{ marginBottom: 14, fontSize: 12 }}>
              Download your bank statement from SBI, HDFC, ICICI, Axis, or Kotak as PDF or Excel.
              Credits are imported as Money In, Debits as Money Out.
            </div>

            <div
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); pickFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current?.click()}
              style={{
                border: '2px dashed ' + (drag ? 'var(--g)' : 'var(--brd)'),
                borderRadius: 'var(--r3)', padding: '36px 24px', textAlign: 'center',
                cursor: 'pointer', background: drag ? 'var(--gl)' : 'var(--card2)',
                marginBottom: 14, transition: 'all .15s',
              }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📂</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 4 }}>
                {file ? file.name : 'Drop file here or click to browse'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>
                {file ? ((file.size / 1024 / 1024).toFixed(2) + ' MB') : 'PDF, Excel (.xlsx), CSV — max 10 MB'}
              </div>
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.xlsx,.xls,.csv"
              style={{ display: 'none' }} onChange={e => pickFile(e.target.files[0])}/>

            {imp && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--t3)', marginBottom:4 }}>
                  <span>Uploading and processing…</span><span>{pct}%</span>
                </div>
                <div style={{ height:4, background:'var(--brd)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:'var(--g)', borderRadius:3, width:pct+'%', transition:'width .3s' }}/>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn bp" style={{ flex: 1, padding: '10px' }} onClick={doImport} disabled={!file || imp}>
                {imp
                  ? <><span className="spin" style={{ width:12, height:12, borderTopColor:'#fff' }}/> Importing…</>
                  : 'Import Transactions'}
              </button>
              {file && <button className="btn bg" onClick={() => { setFile(null); setRes(null); }}>Clear</button>}
            </div>

            {res && (
              <div className="al ag" style={{ marginTop: 12 }}>
                <strong>{res.count} transactions imported.</strong>
                {res.skipped > 0 && <span> ({res.skipped} duplicates skipped.)</span>}
              </div>
            )}
          </div>

          <div className="card banks-col">
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Supported Banks</div>
            {['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'PNB', 'Bank of Baroda', 'Canara', 'Yes Bank', 'IndusInd'].map(b => (
              <div key={b} style={{ padding: '7px 10px', background: 'var(--card2)', borderRadius: 'var(--r2)', fontSize: 12, marginBottom: 5, fontWeight: 500, color: 'var(--t2)' }}>{b}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
