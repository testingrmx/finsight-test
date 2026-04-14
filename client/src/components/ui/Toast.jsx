import { useState, useCallback } from 'react';
let _add = null;
export const toast = {
  ok:  m => _add?.({m,t:'ok', id:Date.now()}),
  err: m => _add?.({m,t:'err',id:Date.now()}),
  inf: m => _add?.({m,t:'inf',id:Date.now()}),
};
export function Toaster(){
  const [list,setList]=useState([]);
  _add = useCallback(item=>{setList(p=>[...p.slice(-3),item]);setTimeout(()=>setList(p=>p.filter(x=>x.id!==item.id)),4000);},[]);
  const bg={ok:'var(--gl)',err:'var(--redl)',inf:'var(--blul)'};
  const bc={ok:'var(--g)', err:'var(--red)', inf:'var(--blu)'};
  const ic={ok:'✅',err:'❌',inf:'ℹ️'};
  return <div className="toasts">{list.map(x=><div key={x.id} className="toast" style={{background:bg[x.t],border:'1.5px solid '+bc[x.t]}}><span>{ic[x.t]}</span><span style={{color:'var(--t1)'}}>{x.m}</span></div>)}</div>;
}
