import { Router } from 'express';
import {
  signup, verifySignup, loginStep1, loginStep2, resend,
  forgotPassword, resetPassword,
  getMe, updateProfile, changePassword, deleteAccount,
  deleteSalaryMonth,
} from '../controllers/auth.js';
import { guard } from '../middleware/guard.js';

const r = Router();
r.post('/signup',           signup);
r.post('/verify-signup',    verifySignup);
r.post('/login',            loginStep1);
r.post('/verify-login',     loginStep2);
r.post('/resend',           resend);
r.post('/forgot-password',  forgotPassword);
r.post('/reset-password',   resetPassword);
r.get ('/me',               guard, getMe);
r.patch('/profile',         guard, updateProfile);
r.patch('/change-password', guard, changePassword);
r.delete('/account',        guard, deleteAccount);
r.delete('/salary/:ym',     guard, deleteSalaryMonth);
export default r;
