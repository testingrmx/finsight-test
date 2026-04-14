import express       from 'express';
import cors          from 'cors';
import helmet        from 'helmet';
import rateLimit     from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import authR       from './routes/auth.js';
import txR         from './routes/tx.js';
import aiR         from './routes/ai.js';
import repR        from './routes/reports.js';
import impR        from './routes/import.js';
import budgetR     from './routes/budget.js';
import investmentR from './routes/investment.js';
import goalR       from './routes/goal.js';

const app = express();

app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS: origin not allowed — ' + origin));
  },
  credentials: true,
  methods: ['GET','POST','PATCH','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit:'5mb' }));
app.use(express.urlencoded({ extended:true, limit:'5mb' }));
app.use(mongoSanitize());

app.use('/api/auth/', rateLimit({ windowMs:15*60*1000, max:30,  standardHeaders:true, legacyHeaders:false }));
app.use('/api/ai/',   rateLimit({ windowMs:60*1000,   max:20,  standardHeaders:true, legacyHeaders:false }));
app.use('/api/',      rateLimit({ windowMs:15*60*1000, max:500, standardHeaders:true, legacyHeaders:false }));

app.use('/api/auth',        authR);
app.use('/api/tx',          txR);
app.use('/api/ai',          aiR);
app.use('/api/rep',         repR);
app.use('/api/imp',         impR);
app.use('/api/budgets',     budgetR);
app.use('/api/investments', investmentR);
app.use('/api/goals',       goalR);

app.get('/api/health', (_, res) => res.json({ ok: true }));
app.use((req, res, _next) => res.status(404).json({ error: 'Not found.' }));

app.use((err, req, res, _next) => {
  if (err.name === 'ValidationError') return res.status(400).json({ error: Object.values(err.errors).map(e=>e.message).join('. ') });
  if (err.code === 11000) return res.status(409).json({ error: Object.keys(err.keyValue)[0]+' already exists.' });
  if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid ID.' });
  if (['JsonWebTokenError','TokenExpiredError'].includes(err.name)) return res.status(401).json({ error: 'Invalid or expired token.' });
  console.error(err.message);
  res.status(err.status||500).json({ error: err.message||'Server error.' });
});

export default app;