import multer from 'multer';
import Tx      from '../models/Tx.js';
import { autoCat } from '../utils/cats.js';
const wrap = fn => (req,res,next) => fn(req,res).catch(next);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 15*1024*1024 },
  fileFilter:(_,file,cb) => {
    const ok=['application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-excel','text/csv'];
    ok.includes(file.mimetype)?cb(null,true):cb(new Error('Only PDF, Excel, or CSV files allowed.'));
  },
});

const toNum = s => { const n=parseFloat(String(s||'').replace(/[^\d.]/g,'')); return isNaN(n)?0:n; };
const toDate = v => {
  if (!v) return new Date().toISOString().split('T')[0];
  if (v instanceof Date&&!isNaN(v)) return v.toISOString().split('T')[0];
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
  const m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (m) { const[,d,mo,y]=m; const yr=y.length===2?'20'+y:y; return yr+'-'+mo.padStart(2,'0')+'-'+d.padStart(2,'0'); }
  const dt = new Date(s); return isNaN(dt)?new Date().toISOString().split('T')[0]:dt.toISOString().split('T')[0];
};


const isSalaryLike = (desc, amount) => {
  const d = desc.toLowerCase();
  const salaryKeywords = ['salary','sal','payroll','pay slip','payslip','monthly pay','emolument','remuneration','stipend','wages','ctc'];
  const hasKeyword = salaryKeywords.some(k => d.includes(k));
  return hasKeyword;
};

const parseExcel = async (buf, hasManuaSalary) => {
  const X  = (await import('xlsx')).default;
  const wb = X.read(buf,{type:'buffer',cellDates:true});
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = X.utils.sheet_to_json(ws,{defval:''});
  const out  = [];
  for (const row of rows) {
    const keys = Object.keys(row);
    const find = (...terms) => keys.find(k=>terms.some(t=>k.toLowerCase().includes(t.toLowerCase())));
    const descK  = find('description','narration','particular','detail','remark','memo','txn','transaction','particulars');
    const dateK  = find('date','dt','posted','value date','txn date','trans date');
    const debK   = find('debit','withdrawal','dr','withdraw','paid','charged','spend');
    const credK  = find('credit','deposit','cr','received','income');
    const amtK   = find('amount','amt','sum','value');
    const desc   = String(row[descK]||row[keys[0]]||'').trim();
    if (!desc||desc.length<2) continue;
    const date  = toDate(row[dateK]);
    const debit = toNum(row[debK]);
    const cred  = toNum(row[credK]);
    const amt   = toNum(row[amtK]);
    if (debit>0.01) out.push({desc,amount:debit,type:'debit',date,cat:autoCat(desc),src:'import'});
    if (cred >0.01) {
      // If user already has manual salary set, skip detected salary txs to avoid duplicates
      const looksLikeSalary = isSalaryLike(desc, cred);
      if (looksLikeSalary && hasManuaSalary) continue;
      out.push({desc,amount:cred,type:'credit',date,cat:looksLikeSalary?'Salary':autoCat(desc),src:'import'});
    }
    if (!debK&&!credK&&amt>0.01) out.push({desc,amount:amt,type:'debit',date,cat:autoCat(desc),src:'import'});
  }
  return out;
};

const parsePdf = async (buf, hasManuaSalary) => {
  const pp   = (await import('pdf-parse/lib/pdf-parse.js')).default;
  const data = await pp(buf);
  const out  = [];
  const lines = data.text.split('\n').map(l=>l.trim()).filter(l=>l.length>4);
  const pat   = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+(.{4,80?}?)\s+([\d,]+\.?\d{0,2})\s*(Dr|Cr|DR|CR)?/;
  for (const line of lines) {
    const m = line.match(pat);
    if (!m) continue;
    const [,ds,desc,as,dc]=m;
    const amt = toNum(as);
    if (amt<1||amt>9_999_999) continue;
    const isCr = (dc||'').toUpperCase()==='CR';
    if (isCr) {
      const looksLikeSalary = isSalaryLike(desc, amt);
      if (looksLikeSalary && hasManuaSalary) continue;
      out.push({desc:desc.trim(),amount:amt,type:'credit',date:toDate(ds),cat:looksLikeSalary?'Salary':autoCat(desc),src:'import'});
    } else {
      out.push({desc:desc.trim(),amount:amt,type:'debit',date:toDate(ds),cat:autoCat(desc),src:'import'});
    }
  }
  return out;
};

export const importFile = wrap(async (req,res) => {
  if (!req.file) return res.status(400).json({ error:'No file uploaded.' });
  
  const hasManuaSalary = !!(req.user?.monthlyIncome && req.user.monthlyIncome > 0 && !req.user.salaryPaused);
  let parsed = [];
  try { parsed = req.file.mimetype==='application/pdf'?await parsePdf(req.file.buffer, hasManuaSalary):await parseExcel(req.file.buffer, hasManuaSalary); }
  catch(e) { return res.status(422).json({ error:'Could not parse: '+e.message }); }
  if (!parsed.length) return res.status(422).json({ error:'No transactions found. Ensure your file has Date, Description, and Amount/Debit/Credit columns.' });
  await Tx.insertMany(parsed.map(t=>({...t,userId:req.user._id})),{ordered:false});
  res.json({ count:parsed.length, preview:parsed.slice(0,5) });
});
