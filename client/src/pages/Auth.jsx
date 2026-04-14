import { useState, useCallback } from 'react';
import { A } from '../services/api.js';
import { useAuth } from '../context/Auth.jsx';
import { toast } from '../components/ui/Toast.jsx';

const FEATURES = [
  'Salary auto-tracked as income each month',
  'AI advisor using your real spending data',
  'Budgets, investments and savings goals',
  'Weekly AI reports with actionable insights',
  'OTP-secured login — your data is safe',
];

const FEAT_CARDS = [
  { icon:'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title:'Auto Salary Tracking', desc:'Set your monthly salary once. It auto-appears as income on the 1st of every month.' },
  { icon:'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h3.5', title:'AI Financial Advisor', desc:'Ask questions about your actual spending data. Personalised insights, not generic advice.' },
  { icon:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', title:'Analytics and Reports', desc:'Visual charts for spending patterns. Weekly AI reports with specific recommendations.' },
  { icon:'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', title:'Budget Management', desc:'Set monthly limits per category. Get alerts when you approach or exceed limits.' },
  { icon:'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', title:'Investment Tracker', desc:'Track mutual funds, stocks, FD, PPF, NPS and gold. See portfolio value and gain/loss.' },
  { icon:'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', title:'Savings Goals', desc:'Set targets for emergency fund, home, vacation or anything. Track progress and contribute.' },
];

const TERMS_ITEMS = [
  'Passwords hashed with bcrypt — never stored as plain text',
  'Every login requires a one-time code sent to your email',
  'Bank statements are processed then immediately discarded',
  'No account numbers or banking credentials are stored',
  'Your data is never sold, shared or used for advertising',
];

const INP_BASE = {
  padding:'11px 13px', background:'var(--inp)', border:'1px solid var(--brd)',
  borderRadius:'var(--r2)', fontSize:15, color:'var(--t1)', outline:'none',
  fontFamily:'inherit', width:'100%', transition:'border-color .13s, box-shadow .13s',
  boxSizing:'border-box',
};

const focusStyle = (e) => {
  e.target.style.borderColor = 'var(--g)';
  e.target.style.boxShadow  = '0 0 0 3px rgba(34,197,94,.12)';
};
const blurStyle = (e) => {
  e.target.style.borderColor = 'var(--brd)';
  e.target.style.boxShadow  = 'none';
};

const TermsModal = ({ onClose }) => (
  <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={onClose}>
    <div style={{ background:'#161b22', border:'1px solid #30363d', borderRadius:14, maxWidth:540, width:'100%', maxHeight:'82vh', overflowY:'auto', padding:28 }} onClick={e=>e.stopPropagation()}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <h3 style={{ fontSize:17, fontWeight:700, color:'#e6edf3' }}>Terms &amp; Privacy Policy</h3>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'#8b949e', cursor:'pointer', fontSize:24, lineHeight:1 }}>×</button>
      </div>
      <div style={{ fontSize:13, color:'#8b949e', lineHeight:1.9 }}>
        <p><strong style={{ color:'#e6edf3' }}>What we collect:</strong> Your name, email address, and the financial transactions you choose to add.</p>
        <p style={{ marginTop:12 }}><strong style={{ color:'#e6edf3' }}>How we protect it:</strong></p>
        <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:7 }}>
          {TERMS_ITEMS.map(item => (
            <div key={item} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:'#22c55e', marginTop:8, flexShrink:0 }}/>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <p style={{ marginTop:12 }}><strong style={{ color:'#e6edf3' }}>Your rights:</strong> You can permanently delete your account and all data from the Profile page at any time.</p>
      </div>
      <button onClick={onClose} style={{ marginTop:22, width:'100%', padding:'12px', background:'#22c55e', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
        Accept &amp; Close
      </button>
    </div>
  </div>
);

export default function Auth() {
  const { login } = useAuth();
  const [view,  setView]  = useState('landing');
  const [mode,  setMode]  = useState('login');
  const [step,  setStep]  = useState(1);
  const [busy,  setBusy]  = useState(false);
  const [email, setEmail] = useState('');
  const [pass,  setPass]  = useState('');
  const [name,  setName]  = useState('');
  const [otp,   setOtp]   = useState('');
  const [agree, setAgree] = useState(false);
  const [showP, setShowP] = useState(false);
  const [terms, setTerms] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const run = async fn => {
    setBusy(true);
    try { await fn(); }
    catch(e) { toast.err(e.response?.data?.error || 'Something went wrong. Try again.'); }
    finally { setBusy(false); }
  };

  const doSignup   = () => run(async () => {
    if (!agree) { toast.err('Please agree to the Terms.'); return; }
    await A.signup({ name, email, password: pass, agreed: true });
    toast.inf('Verification code sent to ' + email);
    setStep(2);
  });
  const doVerifySU = () => run(async () => {
    const { data } = await A.verifySU({ email, otp });
    login(data.token, data.user);
  });
  const doLogin = () => run(async () => {
    await A.login({ email, password: pass });
    toast.inf('Login code sent to ' + email);
    setStep(2);
  });
  const doVerifyLI = () => run(async () => {
    const { data } = await A.verifyLI({ email, otp });
    login(data.token, data.user);
  });
  const doResend = () => {
    if (resendCooldown > 0) return;
    run(async () => {
      await A.resend({ email, purpose: mode === 'signup' ? 'signup' : 'login' });
      toast.ok('New code sent.');
      setResendCooldown(30);
      const iv = setInterval(() => setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(iv); return 0; }
        return prev - 1;
      }), 1000);
    });
  };
  const doForgot = () => run(async () => { await A.forgotPw({ email }); setStep(3); });

  const goAuth     = m => { setView('auth'); setMode(m); setStep(1); setOtp(''); setPass(''); };
  const switchMode = m => { setMode(m); setStep(1); setOtp(''); setPass(''); };

  // ── Primary button ────────────────────────────────────────────────────────
  const PrimaryBtn = ({ label, onClick }) => (
    <button onClick={onClick} disabled={busy} type="button"
      style={{ width:'100%', padding:'13px', background:'var(--g)', color:'#fff', border:'none', borderRadius:'var(--r2)', fontSize:15, fontWeight:700, cursor:busy?'not-allowed':'pointer', opacity:busy?0.6:1, fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all .18s', marginTop:4 }}
      onMouseEnter={e => { if (!busy) { e.currentTarget.style.background='var(--gd)'; e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 4px 14px rgba(34,197,94,.4)'; }}}
      onMouseLeave={e => { e.currentTarget.style.background='var(--g)'; e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
      {busy && <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite', display:'inline-block' }}/>}
      {label}
    </button>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // LANDING PAGE
  // ─────────────────────────────────────────────────────────────────────────
 
  if (view === 'landing') {
    return (
      <div style={{ background:'linear-gradient(155deg,#0d1117 0%,#071510 50%,#0d1117 100%)', minHeight:'100vh', display:'flex', flexDirection:'column' }}>
        <style>{`
          .lp-btn-primary{background:#22c55e;color:#fff;border:none;borderRadius:10px;cursor:pointer;font-family:inherit;font-weight:700;transition:all .18s}
          .lp-btn-primary:hover{background:#16a34a;transform:translateY(-2px);box-shadow:0 8px 24px rgba(34,197,94,.4)}
          .lp-btn-outline{background:transparent;color:#e6edf3;border:1px solid rgba(255,255,255,.15);cursor:pointer;font-family:inherit;font-weight:500;transition:all .18s;border-radius:8px}
          .lp-btn-outline:hover{border-color:rgba(34,197,94,.6);color:#22c55e;background:rgba(34,197,94,.06)}
          .lp-btn-ghost{background:none;border:none;color:#8b949e;cursor:pointer;font-family:inherit;transition:color .15s}
          .lp-btn-ghost:hover{color:#e6edf3}
          .lp-fc{background:rgba(22,27,34,.9);border:1px solid rgba(48,54,61,.8);border-radius:12px;padding:22px;transition:border-color .2s,transform .2s}
          .lp-fc:hover{border-color:rgba(34,197,94,.45);transform:translateY(-3px)}
          .lp-feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
          @media(max-width:900px){.lp-feat-grid{grid-template-columns:repeat(2,1fr)!important}}
          @media(max-width:580px){.lp-feat-grid{grid-template-columns:1fr!important}.lp-hero-btns{flex-direction:column!important;align-items:stretch!important}.lp-hero-btns button{text-align:center}.lp-nav-desktop{display:none!important}.lp-nav-mobile{display:flex!important}}
        `}</style>

        <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(13,17,23,.92)', backdropFilter:'blur(14px)', borderBottom:'1px solid rgba(48,54,61,.6)' }}>
          <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 20px', height:58, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:32, height:32, background:'#22c55e', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:17, color:'#fff' }}>₹</div>
              <span style={{ fontSize:17, fontWeight:800, color:'#e6edf3', letterSpacing:'-.3px' }}>FinSight</span>
            </div>
            <div className="lp-nav-desktop" style={{ display:'flex', alignItems:'center', gap:6 }}>
              <button className="lp-btn-ghost" onClick={() => setTerms(true)} style={{ fontSize:13, padding:'6px 12px' }}>Terms &amp; Privacy</button>
              <button className="lp-btn-outline" onClick={() => goAuth('login')} style={{ fontSize:13, padding:'7px 16px' }}>Sign In</button>
              <button className="lp-btn-primary" onClick={() => goAuth('signup')} style={{ fontSize:13, padding:'8px 18px', borderRadius:8 }}>Get Started Free</button>
            </div>
            <div className="lp-nav-mobile" style={{ display:'none', alignItems:'center', gap:8 }}>
              <button className="lp-btn-outline" onClick={() => goAuth('login')} style={{ fontSize:12, padding:'6px 12px' }}>Sign In</button>
              <button className="lp-btn-primary" onClick={() => goAuth('signup')} style={{ fontSize:12, padding:'6px 14px', borderRadius:7 }}>Start Free</button>
            </div>
          </div>
        </nav>

        <div style={{ flex:1, maxWidth:1100, margin:'0 auto', width:'100%', padding:'72px 20px 60px', display:'flex', flexDirection:'column', gap:56 }}>

          <div style={{ textAlign:'center' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(34,197,94,.1)', border:'1px solid rgba(34,197,94,.25)', borderRadius:999, padding:'5px 14px', fontSize:12, color:'#22c55e', fontWeight:600, marginBottom:22 }}>
              AI-Powered Personal Finance for India
            </div>
            <h1 style={{ fontSize:'clamp(30px,5.5vw,56px)', fontWeight:800, color:'#e6edf3', lineHeight:1.12, marginBottom:16, letterSpacing:-1 }}>
              Track your money.<br/>
              <span style={{ color:'#22c55e' }}>Understand it better.</span>
            </h1>
            <p style={{ fontSize:17, color:'#8b949e', lineHeight:1.75, maxWidth:560, margin:'0 auto 34px' }}>
              Your complete personal finance system — salary tracking, budgets, investments, savings goals and an AI advisor that knows your actual numbers.
            </p>
            <div className="lp-hero-btns" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, flexWrap:'wrap' }}>
              <button className="lp-btn-primary" onClick={() => goAuth('signup')} style={{ padding:'14px 40px', fontSize:16, borderRadius:10 }}>
                Start Tracking Free
              </button>
              <button className="lp-btn-outline" onClick={() => goAuth('login')} style={{ padding:'13px 28px', fontSize:15, borderRadius:10 }}>
                Sign In
              </button>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, maxWidth:480, margin:'0 auto', width:'100%' }}>
            {[{v:'OTP',l:'Every Login'},{v:'Free',l:'Forever'},{v:'100%',l:'Your Data'}].map(s => (
              <div key={s.l} style={{ textAlign:'center', padding:'18px 12px', background:'rgba(34,197,94,.07)', border:'1px solid rgba(34,197,94,.18)', borderRadius:12 }}>
                <div style={{ fontSize:22, fontWeight:800, color:'#22c55e', marginBottom:4 }}>{s.v}</div>
                <div style={{ fontSize:12, color:'#8b949e', fontWeight:500 }}>{s.l}</div>
              </div>
            ))}
          </div>

          <div>
            <h2 style={{ fontSize:22, fontWeight:700, color:'#e6edf3', textAlign:'center', marginBottom:26 }}>Everything you need to manage money better</h2>
            <div className="lp-feat-grid">
              {FEAT_CARDS.map(f => (
                <div key={f.title} className="lp-fc">
                  <div style={{ width:38, height:38, background:'rgba(34,197,94,.14)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={f.icon}/></svg>
                  </div>
                  <h3 style={{ fontSize:14, fontWeight:700, color:'#e6edf3', marginBottom:6 }}>{f.title}</h3>
                  <p style={{ fontSize:12, color:'#8b949e', lineHeight:1.65 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign:'center', padding:'36px 0', borderTop:'1px solid rgba(48,54,61,.5)' }}>
            <h2 style={{ fontSize:20, fontWeight:700, color:'#e6edf3', marginBottom:10 }}>Ready to take control of your finances?</h2>
            <p style={{ fontSize:13, color:'#8b949e', marginBottom:22 }}>Free forever. No credit card. OTP-secured. Your data stays yours.</p>
            <button className="lp-btn-primary" onClick={() => goAuth('signup')} style={{ padding:'13px 36px', fontSize:15, borderRadius:10 }}>
              Create Free Account
            </button>
            <div style={{ marginTop:14, fontSize:13, color:'#57606a' }}>
              Already have an account?{' '}
              <button className="lp-btn-ghost" onClick={() => goAuth('login')} style={{ fontSize:13, fontWeight:600, color:'#22c55e' }}>Sign in</button>
            </div>
            <div style={{ marginTop:16, fontSize:11, color:'#57606a' }}>
              <button className="lp-btn-ghost" onClick={() => setTerms(true)} style={{ fontSize:11 }}>Terms &amp; Privacy Policy</button>
            </div>
          </div>
        </div>

        {terms && <TermsModal onClose={() => setTerms(false)}/>}
      </div>
    );
  }
  // ─────────────────────────────────────────────────────────────────────────
  // AUTH FORM PAGE
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)', flexDirection:'row' }}>
      <style>{`
        .auth-left-panel{flex:1.2;background:linear-gradient(155deg,#0d1117 0%,#071510 60%,#0d1117 100%);display:flex;align-items:center;justify-content:center;padding:48px 40px;position:relative;overflow:hidden}
        .auth-right-panel{width:460px;flex-shrink:0;display:flex;align-items:center;justify-content:center;padding:40px 44px;background:var(--card);border-left:1px solid var(--brd)}
        .auth-field-tab{flex:1;padding:10px;border:none;border-radius:7px;background:transparent;color:var(--t2);font-weight:500;font-size:14px;cursor:pointer;font-family:inherit;transition:all .15s}
        .auth-field-tab.on{background:var(--card);color:var(--t1);font-weight:600;box-shadow:var(--s1)}
        @media(max-width:780px){
          .auth-left-panel{display:none}
          .auth-right-panel{width:100%!important;border-left:none!important;border-top:none!important;padding:32px 20px!important;min-height:100vh;align-items:flex-start;justify-content:flex-start;padding-top:40px!important}
        }
      `}</style>

      {/* Left decorative panel */}
      <div className="auth-left-panel">
        <div style={{ maxWidth:400, width:'100%' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:36 }}>
            <div style={{ width:36, height:36, background:'#22c55e', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:20, color:'#fff' }}>₹</div>
            <span style={{ fontSize:20, fontWeight:800, color:'#e6edf3' }}>FinSight</span>
          </div>
          <h2 style={{ fontSize:28, fontWeight:700, color:'#e6edf3', lineHeight:1.25, marginBottom:12 }}>
            Your money,<br/><span style={{ color:'#22c55e' }}>fully understood.</span>
          </h2>
          <p style={{ fontSize:14, color:'#8b949e', lineHeight:1.8, marginBottom:28 }}>
            AI-powered finance tracking built for India. Track every rupee, beat every budget.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {FEATURES.map(f => (
              <div key={f} style={{ display:'flex', alignItems:'center', gap:10, fontSize:13, color:'#8b949e' }}>
                <div style={{ width:5, height:5, borderRadius:'50%', background:'#22c55e', flexShrink:0 }}/>
                {f}
              </div>
            ))}
          </div>
          <button onClick={() => setView('landing')} style={{ marginTop:32, background:'none', border:'1px solid rgba(255,255,255,.12)', color:'#8b949e', cursor:'pointer', fontSize:12, fontFamily:'inherit', padding:'7px 14px', borderRadius:6, transition:'all .15s' }}
            onMouseEnter={e=>{e.currentTarget.style.color='#e6edf3';e.currentTarget.style.borderColor='rgba(255,255,255,.3)';}}
            onMouseLeave={e=>{e.currentTarget.style.color='#8b949e';e.currentTarget.style.borderColor='rgba(255,255,255,.12)';}}>
            ← Back to home
          </button>
        </div>
      </div>

      <div className="auth-right-panel">
        <div style={{ width:'100%', maxWidth:360 }}>

          <button onClick={() => setView('landing')} style={{ display:'none', background:'none', border:'none', color:'var(--t3)', cursor:'pointer', fontSize:12, fontFamily:'inherit', marginBottom:16, alignItems:'center', gap:4 }} className="mobile-auth-back">
            ← Back to home
          </button>

          {step === 1 && mode !== 'forgot' && (
            <div style={{ display:'flex', background:'var(--card2)', border:'1px solid var(--brd)', borderRadius:'var(--r2)', padding:3, gap:2, marginBottom:24 }}>
              {[['login','Sign In'],['signup','Create Account']].map(([id,l]) => (
                <button key={id} className={'auth-field-tab'+(mode===id?' on':'')} onClick={() => switchMode(id)}>{l}</button>
              ))}
            </div>
          )}

          {/* ── OTP step header ── */}
          {step === 2 && (
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{ width:60, height:60, borderRadius:'50%', background:'var(--gdim)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--g)" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
              <h2 style={{ fontSize:20, fontWeight:700, marginBottom:6 }}>{mode==='login'?'Login Verification':'Verify Email'}</h2>
              <p style={{ fontSize:13, color:'var(--t2)', lineHeight:1.65 }}>
                6-digit code sent to<br/>
                <strong style={{ color:'var(--t1)' }}>{email}</strong>
              </p>
              <p style={{ fontSize:11, color:'var(--t3)', marginTop:8 }}>
                Check your spam folder if not received.
              </p>
            </div>
          )}

          {/* ── Forgot password sent ── */}
          {step === 3 && (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ fontSize:44, marginBottom:14 }}>✉️</div>
              <h2 style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>Check Your Email</h2>
              <p style={{ fontSize:13, color:'var(--t2)', lineHeight:1.7, marginBottom:20 }}>
                If <strong>{email}</strong> is registered, a reset link was sent.
              </p>
              <button onClick={() => switchMode('login')} style={{ background:'none', border:'none', color:'var(--g)', cursor:'pointer', fontSize:13, fontFamily:'inherit', fontWeight:600 }}>Back to Sign In</button>
            </div>
          )}

          {step === 1 && mode === 'signup' && (
            <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
              <div className="fld">
                <label className="lbl">Full Name</label>
                <input
                  style={INP_BASE}
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  autoFocus
                  onChange={e => setName(e.target.value)}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>

              <div className="fld">
                <label className="lbl">Email</label>
                <input
                  style={INP_BASE}
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>

              {/* Password */}
              <div className="fld">
                <label className="lbl">Password <span style={{ fontWeight:400, fontSize:11, color:'var(--t3)' }}>min 8 characters</span></label>
                <div style={{ position:'relative' }}>
                  <input
                    style={{ ...INP_BASE, paddingRight:52 }}
                    type={showP ? 'text' : 'password'}
                    placeholder="Choose a password"
                    value={pass}
                    onChange={e => setPass(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && doSignup()}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  />
                  <button type="button" onClick={() => setShowP(p => !p)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--t3)', fontSize:11, fontFamily:'inherit', fontWeight:600 }}>
                    {showP ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <label style={{ display:'flex', alignItems:'flex-start', gap:9, fontSize:13, color:'var(--t2)', cursor:'pointer', marginBottom:6, lineHeight:1.5 }}>
                <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} style={{ marginTop:3, accentColor:'var(--g)', cursor:'pointer', flexShrink:0, width:15, height:15 }}/>
                <span>I agree to the{' '}
                  <button type="button" onClick={() => setTerms(true)}
                    style={{ background:'none', border:'none', color:'var(--g)', cursor:'pointer', fontSize:13, padding:0, fontFamily:'inherit', fontWeight:600, textDecoration:'underline' }}>
                    Terms &amp; Privacy
                  </button>
                </span>
              </label>
              <PrimaryBtn label="Create Account" onClick={doSignup}/>
            </div>
          )}

          {/* ══════════════════════════════════════════
              LOGIN FORM
          ══════════════════════════════════════════ */}
          {step === 1 && mode === 'login' && (
            <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
              <div className="fld">
                <label className="lbl">Email</label>
                <input
                  style={INP_BASE}
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  autoFocus
                  onChange={e => setEmail(e.target.value)}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>
              <div className="fld">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                  <label className="lbl" style={{ marginBottom:0 }}>Password</label>
                  <button type="button" onClick={() => switchMode('forgot')}
                    style={{ background:'none', border:'none', color:'var(--g)', cursor:'pointer', fontSize:12, fontFamily:'inherit', fontWeight:600 }}>
                    Forgot?
                  </button>
                </div>
                <div style={{ position:'relative' }}>
                  <input
                    style={{ ...INP_BASE, paddingRight:52 }}
                    type={showP ? 'text' : 'password'}
                    placeholder="Your password"
                    value={pass}
                    onChange={e => setPass(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && doLogin()}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  />
                  <button type="button" onClick={() => setShowP(p => !p)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--t3)', fontSize:11, fontFamily:'inherit', fontWeight:600 }}>
                    {showP ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <PrimaryBtn label="Send Login Code" onClick={doLogin}/>
              <p style={{ fontSize:11, color:'var(--t3)', textAlign:'center', marginTop:6, lineHeight:1.6 }}>
                A one-time code is emailed each login for security.
              </p>
            </div>
          )}

          {/* ══════════════════════════════════════════
              FORGOT PASSWORD
          ══════════════════════════════════════════ */}
          {step === 1 && mode === 'forgot' && (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ marginBottom:4 }}>
                <h2 style={{ fontSize:20, fontWeight:700, marginBottom:6 }}>Reset Password</h2>
                <p style={{ fontSize:13, color:'var(--t2)', lineHeight:1.6 }}>Enter your email and we will send a reset link.</p>
              </div>
              <div className="fld">
                <label className="lbl">Email</label>
                <input
                  style={INP_BASE}
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  autoFocus
                  onChange={e => setEmail(e.target.value)}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>
              <PrimaryBtn label="Send Reset Link" onClick={doForgot}/>
              <button onClick={() => switchMode('login')}
                style={{ background:'none', border:'none', color:'var(--t3)', cursor:'pointer', fontSize:13, fontFamily:'inherit', textAlign:'center', marginTop:4, transition:'color .15s' }}
                onMouseEnter={e=>e.currentTarget.style.color='var(--t1)'}
                onMouseLeave={e=>e.currentTarget.style.color='var(--t3)'}>
                Back to Sign In
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════
              OTP ENTRY
          ══════════════════════════════════════════ */}
          {step === 2 && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div className="fld">
                <label className="lbl">Enter 6-digit code</label>
                <input
                  style={{ ...INP_BASE, fontSize:26, fontFamily:'monospace', letterSpacing:10, textAlign:'center', paddingLeft:0 }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  autoFocus
                  onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                  onKeyDown={e => e.key==='Enter' && (mode==='signup' ? doVerifySU() : doVerifyLI())}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>
              <PrimaryBtn label={mode==='login' ? 'Verify and Sign In' : 'Verify and Continue'} onClick={mode==='signup' ? doVerifySU : doVerifyLI}/>
              <div style={{ display:'flex', justifyContent:'center', gap:20, fontSize:13 }}>
                <button onClick={doResend} disabled={busy || resendCooldown > 0}
                  style={{ background:'none', border:'none', color: resendCooldown > 0 ? 'var(--t3)' : 'var(--g)', cursor: resendCooldown > 0 ? 'default' : 'pointer', fontFamily:'inherit', fontWeight:600 }}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
                <span style={{ color:'var(--brd)' }}>|</span>
                <button onClick={() => { setStep(1); setOtp(''); }}
                  style={{ background:'none', border:'none', color:'var(--t3)', cursor:'pointer', fontFamily:'inherit' }}>
                  Back
                </button>
              </div>
            </div>
          )}

          {step !== 3 && (
            <p style={{ fontSize:11, color:'var(--t3)', textAlign:'center', marginTop:22, lineHeight:1.5 }}>
              Your data is encrypted and protected.
            </p>
          )}
        </div>
      </div>

      {terms && <TermsModal onClose={() => setTerms(false)}/>}
    </div>
  );
}