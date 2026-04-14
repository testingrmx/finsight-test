export const CATS = ['Groceries','Food & Dining','Transport','Entertainment','Healthcare','Education','Shopping','Utilities','Savings','Personal Care','Gifts','Housing & Rent','Insurance','EMI / Loan','Travel','Subscriptions','Charity','Family','Other'];

export const INCOME_CATS = ['Salary','Business Income','Freelance','Rental Income','Dividends','Interest','Bonus','Investment Returns','Other Income'];

export const PAYMENT_MODES = [
  { value:'upi',         label:'UPI' },
  { value:'cash',        label:'Cash' },
  { value:'netbanking',  label:'Net Banking' },
  { value:'credit_card', label:'Credit Card' },
  { value:'debit_card',  label:'Debit Card' },
  { value:'cheque',      label:'Cheque' },
];

export const INVESTMENT_TYPES = [
  { value:'mutual_fund',  label:'Mutual Fund' },
  { value:'stocks',       label:'Stocks' },
  { value:'fd',           label:'Fixed Deposit' },
  { value:'ppf',          label:'PPF' },
  { value:'nps',          label:'NPS' },
  { value:'gold',         label:'Gold' },
  { value:'real_estate',  label:'Real Estate' },
  { value:'crypto',       label:'Crypto' },
  { value:'other',        label:'Other' },
];

export const GOAL_CATS = [
  { value:'emergency_fund', label:'Emergency Fund' },
  { value:'home',           label:'Home' },
  { value:'vehicle',        label:'Vehicle' },
  { value:'education',      label:'Education' },
  { value:'vacation',       label:'Vacation' },
  { value:'retirement',     label:'Retirement' },
  { value:'wedding',        label:'Wedding' },
  { value:'other',          label:'Other' },
];

export const CHART_COLORS = ['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316','#84cc16'];

export const CC = {
  Groceries:'#22c55e', 'Food & Dining':'#f97316', Transport:'#3b82f6',
  Entertainment:'#a855f7', Healthcare:'#ef4444', Education:'#06b6d4',
  Shopping:'#ec4899', Utilities:'#64748b', Savings:'#84cc16',
  'Personal Care':'#f59e0b', Gifts:'#e11d48', Other:'#94a3b8',
  Salary:'#22c55e', Credit:'#d29922', 'Housing & Rent':'#8b5cf6',
  Insurance:'#14b8a6', 'EMI / Loan':'#f85149', Travel:'#0ea5e9',
  Subscriptions:'#a78bfa', Charity:'#fb7185', Family:'#fbbf24',
};

export const CI = {
  Groceries:'🛒', 'Food & Dining':'🍽️', Transport:'🚗', Entertainment:'🎬',
  Healthcare:'🏥', Education:'📚', Shopping:'🛍️', Utilities:'⚡',
  Savings:'💰', 'Personal Care':'💆', Gifts:'🎁', Other:'📦',
  Salary:'💼', Credit:'💳', 'Housing & Rent':'🏠', Insurance:'🛡️',
  'EMI / Loan':'🏦', Travel:'✈️', Subscriptions:'📱', Charity:'❤️', Family:'👨‍👩‍👧',
};

export const TYPE_COLOR = {
  credit:'var(--g)', debit:'var(--red)',
};

export const fmt     = n  => new Intl.NumberFormat('en-IN',{ style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n||0);
export const fmtD    = s  => { if(!s) return ''; return new Date(s+'T00:00:00').toLocaleDateString('en-IN',{ day:'numeric', month:'short', year:'numeric' }); };
export const safeDate = v => { if(!v) return '—'; const d=new Date(v); return isNaN(d.getTime())?'—':d.toLocaleDateString('en-IN',{ day:'numeric', month:'long', year:'numeric' }); };
export const relD    = s  => { const d=Math.floor((new Date()-new Date(s+'T00:00:00'))/86400000); if(d===0) return 'Today'; if(d===1) return 'Yesterday'; if(d<7) return d+'d ago'; return fmtD(s); };
export const today   = () => new Date().toISOString().split('T')[0];
export const dAgo    = n  => { const d=new Date(); d.setDate(d.getDate()-n); return d.toISOString().split('T')[0]; };
export const nowYM   = () => { const n=new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`; };
export const ymLabel = m  => { if(!m) return ''; const [y,mo]=m.split('-'); return new Date(+y,+mo-1,1).toLocaleString('en-IN',{month:'short',year:'numeric'}); };

export const autoCat = desc => {
  const s = (desc||'').toLowerCase();
  if(/grocery|supermarket|kirana|bigbasket|blinkit|zepto|dmart|sabzi|vegetable|fruit/.test(s)) return 'Groceries';
  if(/restaurant|cafe|coffee|swiggy|zomato|food|dhaba|canteen|pizza|burger|kfc|dominos|bakery|snack|meal|lunch|breakfast|dining/.test(s)) return 'Food & Dining';
  if(/uber|ola|rapido|metro|bus|petrol|fuel|diesel|cab|taxi|train|irctc|auto|toll|parking|fastag|flight/.test(s)) return 'Transport';
  if(/netflix|prime|hotstar|spotify|movie|cinema|pvr|inox|concert|game|steam|club|chrunchyroll|anime|bar/.test(s)) return 'Entertainment';
  if(/doctor|hospital|clinic|medicine|pharmacy|apollo|1mg|health|dental|lab|tablet|vitamin/.test(s)) return 'Healthcare';
  if(/school|college|tuition|coaching|udemy|byju|book|course|fees|exam|pw|library/.test(s)) return 'Education';
  if(/amazon|flipkart|myntra|ajio|meesho|mall|clothes|dress|shirt|shoes|fashion|bag|laptop|mobile/.test(s)) return 'Shopping';
  if(/electricity|water bill|gas bill|internet|wifi|jio|airtel|bsnl|maintenance/.test(s)) return 'Utilities';
  if(/rent|pg|hostel/.test(s)) return 'Housing & Rent';
  if(/emi|loan|lic|insurance/.test(s)) return 'EMI / Loan';
  if(/sip|mutual fund|fd|invest|ppf|nps|saving|groww|zerodha/.test(s)) return 'Savings';
  if(/salon|spa|haircut|grooming|beauty|soap|shampoo|perfume|makeup/.test(s)) return 'Personal Care';
  if(/gift|birthday|anniversary|wedding|flower|donation/.test(s)) return 'Gifts';
  if(/holiday|travel|hotel|airbnb|trip/.test(s)) return 'Travel';
  return 'Other';
};
