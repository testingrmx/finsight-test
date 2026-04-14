import { Router } from 'express';
import { upload,importFile } from '../controllers/imp.js';
import { guard } from '../middleware/guard.js';
const r = Router();
r.use(guard);
r.post('/', upload.single('file'), importFile);
export default r;
