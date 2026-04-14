import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/Auth.jsx';

const LINKS = [
  { to:'/',            l:'Dashboard',   d:'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { to:'/tx',          l:'Transactions',d:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { to:'/add',         l:'Add Entry',   d:'M12 4v16m-8-8h16' },
  { to:'/charts',      l:'Analytics',   d:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { to:'/budgets',     l:'Budgets',     d:'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { to:'/investments', l:'Investments', d:'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  { to:'/goals',       l:'Goals',       d:'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { to:'/ai',          l:'AI Advisor',  d:'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { to:'/rep',         l:'Reports',     d:'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { to:'/prof',        l:'Profile',     d:'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
];

const PAGE = {'/':'Dashboard','/tx':'Transactions','/add':'Add Entry','/charts':'Analytics','/budgets':'Budgets','/investments':'Investments','/goals':'Goals','/ai':'AI Advisor','/rep':'Reports','/prof':'Profile'};

const Ico = ({ d, s=16 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
    <path d={d}/>
  </svg>
);

const ThemeSwitch = ({ dark, toggleDk }) => (
  <button onClick={toggleDk} title={dark ? 'Switch to light' : 'Switch to dark'}
    style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 8px', background:'var(--card2)', border:'1px solid var(--brd)', borderRadius:999, cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>
    <div style={{ width:30, height:15, background:dark?'var(--g)':'var(--brd)', borderRadius:999, position:'relative', transition:'background .2s', flexShrink:0 }}>
      <div style={{ position:'absolute', top:2, left:dark?16:2, width:11, height:11, borderRadius:'50%', background:'#fff', transition:'left .2s' }}/>
    </div>
    <span style={{ fontSize:10, color:'var(--t2)', fontWeight:500, whiteSpace:'nowrap' }}>{dark?'Dark':'Light'}</span>
  </button>
);

export default function Shell() {
  const [col,    setCol]    = useState(false);
  const [drawer, setDrawer] = useState(false);
  const { dark, toggleDk, logout, user } = useAuth();
  const nav  = useNavigate();
  const loc  = useLocation();
  const isAdvisor = loc.pathname === '/ai';
  const title = PAGE[loc.pathname] || 'FinSight';

  const doLogout = () => { logout(); nav('/login'); };

  const Avatar = ({ size=28, fs=12 }) => (
    <div onClick={() => nav('/prof')} title="Go to Profile"
      style={{ width:size, height:size, borderRadius:'50%', background:'linear-gradient(135deg,var(--g),var(--gd))', color:'#fff', fontWeight:700, fontSize:fs, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0, cursor:'pointer' }}>
      {user?.avatar ? <img src={user.avatar} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/> : (user?.name?.[0]?.toUpperCase()||'U')}
    </div>
  );

  return (
    <div className="layout">
      <aside className={'sidebar'+(col?' col':'')}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 12px 10px', borderBottom:'1px solid var(--brd)', flexShrink:0, overflow:'hidden' }}>
          <div style={{ width:28, height:28, background:'var(--g)', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:14, color:'#fff', flexShrink:0 }}>₹</div>
          {!col && <span style={{ fontSize:15, fontWeight:700, color:'var(--t1)', letterSpacing:'-.3px' }}>FinSight</span>}
        </div>

        <nav style={{ flex:1, padding:'6px 8px', display:'flex', flexDirection:'column', gap:1, overflowY:'auto' }}>
          {LINKS.map(({ to, l, d }) => (
            <NavLink key={to} to={to} end={to==='/'} className={({ isActive }) => 'ni'+(isActive?' on':'')}>
              <Ico d={d}/>
              {!col && <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l}</span>}
            </NavLink>
          ))}
        </nav>

        {!col && (
          <div onClick={() => nav('/prof')} style={{ padding:'10px 12px', borderTop:'1px solid var(--brd)', display:'flex', alignItems:'center', gap:8, flexShrink:0, overflow:'hidden', cursor:'pointer', transition:'background .13s' }}
            onMouseEnter={e => e.currentTarget.style.background='var(--card2)'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
            <Avatar size={26} fs={11}/>
            <div style={{ minWidth:0, flex:1 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize:10, color:'var(--t3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</div>
            </div>
          </div>
        )}

        <div style={{ padding:'8px', borderTop:'1px solid var(--brd)', display:'flex', flexDirection:col?'column':'row', gap:4, flexShrink:0 }}>
          <button title="Toggle sidebar" className="bico" onClick={() => setCol(c=>!c)} style={{ flex:col?undefined:1, borderRadius:'var(--r1)' }}>
            <Ico d="M3 6h18M3 12h18M3 18h18" s={15}/>
          </button>
          <button title="Sign out" className="bico" onClick={doLogout} style={{ flex:col?undefined:1, borderRadius:'var(--r1)' }}>
            <Ico d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" s={15}/>
          </button>
        </div>
      </aside>

      <div className={'main-area'+(col?' col':'')}>
        <header className="hdr">
          <button className="hbg" onClick={() => setDrawer(true)}>
            <span/><span/><span/>
          </button>
          <span style={{ fontSize:15, fontWeight:700, color:'var(--t1)' }}>{title}</span>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <ThemeSwitch dark={dark} toggleDk={toggleDk}/>
            <Avatar size={30} fs={12}/>
          </div>
        </header>
        <main className={'pg'+(isAdvisor?' pg-advisor':'')}><Outlet/></main>
      </div>

      {drawer && (
        <>
          <div className="drw-bg" onClick={() => setDrawer(false)}/>
          <div className="drw">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:'1px solid var(--brd)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:24, height:24, background:'var(--g)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:12, color:'#fff' }}>₹</div>
                <span style={{ fontWeight:700, fontSize:14, color:'var(--t1)' }}>FinSight</span>
              </div>
              <button className="bico" onClick={() => setDrawer(false)}><Ico d="M6 18L18 6M6 6l12 12"/></button>
            </div>
            <nav style={{ flex:1, padding:'8px', overflowY:'auto' }}>
              {LINKS.map(({ to, l, d }) => (
                <NavLink key={to} to={to} end={to==='/'} onClick={() => setDrawer(false)} className={({ isActive }) => 'ni'+(isActive?' on':'')}>
                  <Ico d={d}/><span>{l}</span>
                </NavLink>
              ))}
            </nav>
            <div style={{ padding:'10px 12px', borderTop:'1px solid var(--brd)', display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <ThemeSwitch dark={dark} toggleDk={toggleDk}/>
                <button onClick={() => { doLogout(); setDrawer(false); }}
                  style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--red)', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>
                  <Ico d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" s={14}/>
                  Sign out
                </button>
              </div>
              <div onClick={() => { nav('/prof'); setDrawer(false); }} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 4px', cursor:'pointer', borderRadius:'var(--r2)', transition:'background .13s' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--card2)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <Avatar size={28} fs={11}/>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</div>
                  <div style={{ fontSize:10, color:'var(--t3)' }}>{user?.email}</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
