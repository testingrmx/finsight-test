import { Router } from 'express';
import { list, create, remove, overview, catSummary, dailySpend, monthlySummary, runningBalance, salaryMonths } from '../controllers/tx.js';
import { guard } from '../middleware/guard.js';

const r = Router();
r.use(guard);
r.get('/overview',      overview);
r.get('/balance',       runningBalance);
r.get('/salary-months', salaryMonths);
r.get('/cats',          catSummary);
r.get('/daily',         dailySpend);
r.get('/monthly',       monthlySummary);
r.get('/',              list);
r.post('/',             create);
r.delete('/:id',        remove);

export default r;
