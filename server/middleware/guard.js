import { readToken } from '../utils/jwt.js';
import User from '../models/User.js';

export const guard = async (req, res, next) => {
  try {
    const h = req.headers.authorization;
    if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token.' });
    const d = readToken(h.slice(7));
    if (!d?.id) return res.status(401).json({ error: 'Invalid token.' });
    const u = await User.findById(d.id);
    if (!u) return res.status(401).json({ error: 'User not found.' });
    req.user = u;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};
