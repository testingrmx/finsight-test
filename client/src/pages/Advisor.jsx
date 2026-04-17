import { useState, useRef, useEffect, useCallback } from 'react';
import { A } from '../services/api.js';
import { useAuth } from '../context/Auth.jsx';
import { today, dAgo } from '../utils/h.js';
 
const RANGES = [
  { label: 'This month',   value: 'current' },
  { label: 'Last 30 days', value: '30' },
  { label: 'Last 90 days', value: '90' },
  { label: 'Full history', value: 'all' },
];
 
const QUICK = [
  'Where is most of my money going?',
  'How can I reduce my expenses?',
  'Give me a monthly budget plan',
  'Am I overspending on any category?',
  'How to build a 3-month emergency fund?',
  'Should I start a SIP with my savings?',
];
 
export default function Advisor() {
  const { user } = useAuth();
  const uid = user?.id || user?._id || 'guest';
 
  const chatKey = `fs_chat_${uid}`;
  const tipsKey = `fs_tips_${uid}`;
 
  const getInitMsgs = useCallback(() => {
    try {
      const s = JSON.parse(localStorage.getItem(chatKey));
      return Array.isArray(s) && s.length ? s : null;
    } catch { return null; }
  }, [chatKey]);
 
  const [msgs,    setMsgs]    = useState(() => getInitMsgs() || [{ role: 'ai', text: 'I can see your actual transaction data. Ask me anything about your finances.' }]);
  const [tips,    setTips]    = useState(() => { try { return JSON.parse(localStorage.getItem(tipsKey)) || []; } catch { return []; } });
  const [inp,     setInp]     = useState('');
  const [busy,    setBusy]    = useState(false);
  const [range,   setRange]   = useState('current');
  const [sbOpen,  setSbOpen]  = useState(false);
  const [mobTab,  setMobTab]  = useState('chat'); 
 
  const hist     = useRef([]);
  const bottom   = useRef(null);
  const inputRef = useRef(null);
  const taRef    = useRef(null);
 
  const resize = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };
 
  useEffect(() => {
    localStorage.setItem(chatKey, JSON.stringify(msgs.slice(-60)));
  }, [msgs, chatKey]);
 
  useEffect(() => {
    setMsgs(getInitMsgs() || [{ role: 'ai', text: 'I can see your actual transaction data. Ask me anything about your finances.' }]);
    setTips(() => { try { return JSON.parse(localStorage.getItem(tipsKey)) || []; } catch { return []; } });
    hist.current = [];
  }, [uid]);
 
  useEffect(() => {
    if (!tips.length) {
      A.aiTips().then(({ data }) => {
        const t = (data.tips || []).filter(x => typeof x === 'string');
        setTips(t);
        localStorage.setItem(tipsKey, JSON.stringify(t));
      }).catch(() => {});
    }
  }, [uid]);
 
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);
 
  const rangeParams = () => {
    if (range === 'current') return {};
    if (range === 'all') return { rangeFrom: '2020-01-01', rangeTo: today() };
    return { rangeFrom: dAgo(+range), rangeTo: today() };
  };
 
  const send = useCallback(async (txt) => {
    const msg = (txt ?? inp).trim();
    if (!msg || busy) return;
    setInp('');
    setTimeout(resize, 0);
    setBusy(true);
    setSbOpen(false);
    setMobTab('chat');
    setMsgs(p => [...p, { role: 'user', text: msg }]);
    try {
      const { data } = await A.aiChat({ message: msg, history: hist.current, ...rangeParams() });
      setMsgs(p => [...p, { role: 'ai', text: data.reply }]);
      hist.current = [...hist.current,
        { role: 'user', content: msg },
        { role: 'assistant', content: data.reply },
      ].slice(-12);
    } catch (e) {
      setMsgs(p => [...p, { role: 'ai', text: e.response?.data?.error || 'AI unavailable. Please try again.' }]);
    } finally {
      setBusy(false);
      const isMobile = window.innerWidth <= 768;
      if (!isMobile) setTimeout(() => taRef.current?.focus(), 80);
    }
  }, [inp, busy, range]);
 
  const clear = () => {
    const init = [{ role: 'ai', text: 'Chat cleared. Ask me anything about your finances.' }];
    setMsgs(init);
    hist.current = [];
    localStorage.setItem(chatKey, JSON.stringify(init));
  };
 
  const openTips = () => { setSbOpen(true); setMobTab('tips'); };
  const closeOverlay = () => { setSbOpen(false); setMobTab('chat'); };
 
  const Ico = ({ d, s = 15 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ display:'block', flexShrink:0 }}>
      <path d={d}/>
    </svg>
  );
 
  return (
    <div className="fade" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="adv-wrap">
 
        <div className={'adv-overlay' + (sbOpen ? ' open' : '')} onClick={closeOverlay}/>
 
        <aside className={'adv-sb' + (sbOpen ? ' open' : '')}>
          <div className="adv-sb-head">
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Insights</span>
          </div>
 
          <div className="adv-sb-body">
            {tips.length > 0 && (
              <>
                <div className="adv-sec">AI Tips</div>
                {tips.map((t, i) => (
                  <div key={i} className="adv-tip">{t}</div>
                ))}
              </>
            )}
 
            <div className="adv-sec" style={{ marginTop: tips.length ? 10 : 0 }}>Quick Questions</div>
            {QUICK.map(q => (
              <button key={q} className="adv-qbtn" disabled={busy} onClick={() => send(q)}>{q}</button>
            ))}
          </div>
        </aside>
 
        <div className="adv-chat">
 
          <div className="adv-head">
            <div className="adv-head-left">
              <div className="adv-ai-dot">AI</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>AI Advisor</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>Based on your real data</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <select value={range} onChange={e => setRange(e.target.value)}
                style={{ padding: '5px 6px', background: 'var(--inp)', border: '1px solid var(--brd)', borderRadius: 'var(--r2)', fontSize: 11, color: 'var(--t1)', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', maxWidth: 110 }}>
                {RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <button onClick={clear}
                style={{ padding: '5px 9px', background: 'transparent', border: '1px solid var(--brd)', borderRadius: 'var(--r2)', fontSize: 11, color: 'var(--t3)', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'color .12s,border-color .12s' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--t2)'; e.currentTarget.style.borderColor = 'var(--t3)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.borderColor = 'var(--brd)'; }}>
                Clear
              </button>
            </div>
          </div>
 
          <div className="adv-msgs">
            {msgs.map((m, i) => (
              <div key={i} className={'adv-row' + (m.role === 'user' ? ' user' : '')}>
                {m.role === 'ai' && <div className="adv-ai-dot">AI</div>}
                <div className={'adv-bubble ' + (m.role === 'ai' ? 'adv-bubble-ai' : 'adv-bubble-user')}>
                  {m.text}
                </div>
              </div>
            ))}
 
            {busy && (
              <div className="adv-row">
                <div className="adv-ai-dot">AI</div>
                <div className="adv-bubble adv-bubble-ai" style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '12px 14px' }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--g)', display: 'block', animation: `bounce 1.1s ease infinite`, animationDelay: i * .18 + 's' }}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottom}/>
          </div>
 
          <div className="adv-input">
            <div className="adv-input-row">
              <textarea
                ref={taRef}
                className="adv-textarea"
                rows={1}
                value={inp}
                placeholder="Ask about your finances…"
                disabled={busy}
                onChange={e => { setInp(e.target.value); resize(); }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              />
              <button className="adv-send" disabled={busy || !inp.trim()} onClick={() => send()}>
                {busy
                  ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .6s linear infinite', display: 'block' }}/>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={(!inp.trim()) ? 'var(--t3)' : '#fff'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                }
              </button>
            </div>
            <div className="adv-hint">AI uses only your actual data · Not financial advice</div>
          </div>
 
          <div className="adv-mob-tabs">
            <button className={'adv-mtab' + (mobTab === 'chat' ? ' on' : '')} onClick={() => { setMobTab('chat'); setSbOpen(false); }}>
              <Ico d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              Chat
            </button>
            <button className={'adv-mtab' + (mobTab === 'tips' ? ' on' : '')} onClick={openTips}>
              <Ico d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              Insights
            </button>
          </div>
 
        </div>
      </div>
    </div>
  );
}