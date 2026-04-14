import axios from 'axios';

const http = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || '') + '/api',
  timeout: 30000,
});

http.interceptors.request.use(cfg => {
  const tok = localStorage.getItem('_tok');
  if (tok) cfg.headers.Authorization = 'Bearer ' + tok;
  return cfg;
});

http.interceptors.response.use(
  r => r,
  e => {
    if (e.response?.status === 401 && !e.config?.url?.includes('/auth/')) {
      Object.keys(localStorage).filter(k => k.startsWith('fs_') || k === '_tok' || k === '_usr').forEach(k => localStorage.removeItem(k));
      window.location.href = '/login';
    }
    return Promise.reject(e);
  }
);

export const A = {
  signup:         d  => http.post('/auth/signup', d),
  verifySU:       d  => http.post('/auth/verify-signup', d),
  login:          d  => http.post('/auth/login', d),
  verifyLI:       d  => http.post('/auth/verify-login', d),
  resend:         d  => http.post('/auth/resend', d),
  forgotPw:       d  => http.post('/auth/forgot-password', d),
  resetPw:        d  => http.post('/auth/reset-password', d),
  me:             () => http.get('/auth/me'),
  profile:        d  => http.patch('/auth/profile', d),
  changePw:       d  => http.patch('/auth/change-password', d),
  delAcct:        d  => http.delete('/auth/account', { data: d }),
  delSalaryMonth: ym => http.delete('/auth/salary/' + ym),
  salaryMonths: () => http.get('/tx/salary-months'),

  txList:         p  => http.get('/tx', { params: p }),
  txCreate:       d  => http.post('/tx', d),
  txDel:          id => http.delete('/tx/' + id),
  txOverview:     () => http.get('/tx/overview'),
  txCats:         p  => http.get('/tx/cats', { params: p }),
  txDaily:        p  => http.get('/tx/daily', { params: p }),
  txMonthly:      () => http.get('/tx/monthly'),
  txBalance:      () => http.get('/tx/balance'),

  aiChat:   d  => http.post('/ai/chat', d),
  aiTips:   () => http.get('/ai/tips'),
  repWeekly:() => http.get('/rep/weekly'),

  impUpload: (file, onP) => {
    const fd = new FormData(); fd.append('file', file);
    return http.post('/imp', fd, { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress: p => onP && onP(Math.round(p.loaded * 100 / p.total)) });
  },

  budgetList:   p  => http.get('/budgets', { params: p }),
  budgetCreate: d  => http.post('/budgets', d),
  budgetUpdate: (id, d) => http.patch('/budgets/' + id, d),
  budgetDel:    id => http.delete('/budgets/' + id),

  invList:      () => http.get('/investments'),
  invPortfolio: () => http.get('/investments/portfolio'),
  invCreate:    d  => http.post('/investments', d),
  invUpdate:    (id, d) => http.patch('/investments/' + id, d),
  invDel:       id => http.delete('/investments/' + id),

  goalList:        () => http.get('/goals'),
  goalCreate:      d  => http.post('/goals', d),
  goalUpdate:      (id, d) => http.patch('/goals/' + id, d),
  goalContribute:  (id, d) => http.post('/goals/' + id + '/contribute', d),
  goalDel:         id => http.delete('/goals/' + id),
};