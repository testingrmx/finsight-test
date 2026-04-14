const API = 'https://api.brevo.com/v3/smtp/email';
const KEY = () => process.env.BREVO_API_KEY;

const senderEmail = () => process.env.BREVO_FROM || process.env.BREVO_USER;
const senderName  = () => process.env.BREVO_SENDER_NAME || 'FinSight';

const send = async (to, subject, html) => {
  const key = KEY();
  if (!key) {
    console.log('[MAIL DEV] To:', to, '| Subject:', subject);
    return;
  }

  const res = await fetch(API, {
    method:  'POST',
    headers: {
      'accept':       'application/json',
      'content-type': 'application/json',
      'api-key':      key,
    },
    body: JSON.stringify({
      sender:   { name: senderName(), email: senderEmail() },
      to:       [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Brevo API error: ' + res.status);
  }
};

export const sendOtp = async (to, name, otp, mode) => {
  const sub  = mode === 'login' ? 'FinSight Login Code' : 'FinSight - Verify Email';
  const body = mode === 'login' ? 'Your one-time login code:' : 'Verify your email with this code:';

  if (!KEY()) {
    console.log('[OTP DEV] ' + to + ' code: ' + otp);
    return;
  }

  await send(to, sub, `
    <div style="font-family:Arial;max-width:460px;margin:auto;padding:28px;background:#f9f9f9;border-radius:12px">
      <h2 style="color:#0f172a">Hi ${name}!</h2>
      <p style="color:#475569">${body}</p>
      <div style="font-size:36px;font-weight:900;letter-spacing:10px;color:#22c55e;text-align:center;background:#f0fdf4;border-radius:8px;padding:18px;margin:16px 0">${otp}</div>
      <p style="color:#94a3b8;font-size:12px">Expires in 10 minutes. Do not share this code.</p>
    </div>
  `);
};

export const sendResetEmail = async (to, name, token) => {
  const url = (process.env.CLIENT_URL || 'http://localhost:5173') + '/reset-password?token=' + token;

  if (!KEY()) {
    console.log('[RESET DEV] ' + to + ' url: ' + url);
    return;
  }

  await send(to, 'FinSight - Reset Your Password', `
    <div style="font-family:Arial;max-width:460px;margin:auto;padding:28px;background:#f9f9f9;border-radius:12px">
      <h2 style="color:#0f172a">Hi ${name}!</h2>
      <p style="color:#475569">Click the button below to reset your password. This link expires in 1 hour.</p>
      <a href="${url}" style="display:block;margin:20px 0;padding:14px 24px;background:#22c55e;color:#fff;text-decoration:none;border-radius:8px;text-align:center;font-weight:700;font-size:15px">Reset Password</a>
      <p style="color:#94a3b8;font-size:12px">If you did not request this, ignore this email.</p>
    </div>
  `);
};