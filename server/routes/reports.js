import { Router } from 'express';
import { weekly } from '../controllers/reports.js';
import { guard }  from '../middleware/guard.js';
const r = Router();
r.use(guard);
r.get('/weekly', weekly);
export default r;
