import jwt from 'jsonwebtoken';
const secret = () => process.env.JWT_SECRET || 'finsight_dev_fallback_change_in_production';
export const makeToken = id => jwt.sign({ id }, secret(), { expiresIn: '7d' });
export const readToken = t  => jwt.verify(t, secret());
