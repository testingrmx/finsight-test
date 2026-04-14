# FinSight — AI-Powered Personal Finance Tracker

A full-stack personal finance web app built for Indian users. Track income, expenses, investments, savings goals and budgets — with an AI advisor that reads your actual transaction data.

**Live:** https://finsight-adv-rmx.onrender.com

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6, Recharts |
| Backend | Node.js (ESM), Express |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT + OTP email verification |
| Email | Brevo HTTP API |
| AI | Groq (Llama 3) |
| Hosting | Render (Static Site + Web Service) |

---

## Features

- **OTP login** — every login requires a one-time code sent to email
- **Auto salary tracking** — income auto-inserted on the 1st of each month
- **Transactions** — expense, income, credit and savings types
- **Running balance** — monthly carry-forward savings pool
- **Budgets** — per-category monthly limits with overspend alerts
- **Investments** — mutual funds, stocks, FD, PPF, NPS, gold portfolio tracker
- **Savings goals** — set targets, track progress, log contributions
- **Analytics** — interactive charts with cross-filtering
- **AI Advisor** — chat with an AI that knows your actual spending data
- **Weekly reports** — AI-generated spending summary every week
- **Bank import** — upload PDF, Excel or CSV bank statements
- **Dark / light theme**

---

## Project Structure

```
finsight/
├── server/
│   ├── controllers/        auth, tx, budget, investment, goal, ai, reports, import
│   ├── models/             User, Tx, Budget, Investment, Goal
│   ├── routes/             one file per resource
│   ├── middleware/         JWT guard
│   ├── utils/
│   │   ├── mailer.js       Brevo HTTP API email sender
│   │   ├── jwt.js          token sign / verify
│   │   ├── groq.js         Groq AI client
│   │   ├── salary.js       auto salary insertion logic
│   │   └── cats.js         category auto-detection
│   ├── app.js              Express setup, CORS, rate limiting
│   ├── index.js            entry point
│   └── package.json
│
├── client/
│   ├── public/
│   │   └── _redirects      SPA routing fix for Render
│   ├── src/
│   │   ├── pages/          Dashboard, Tx, Add, Charts, Budgets,
│   │   │                   Investments, Goals, Advisor, Reports,
│   │   │                   Profile, Auth
│   │   ├── components/     Shell (layout + nav), Toast, Modal
│   │   ├── context/        Auth (user, theme, logout)
│   │   ├── services/       Axios API client
│   │   ├── utils/          formatters, helpers
│   │   ├── App.jsx         routes + auth guards
│   │   ├── main.jsx        entry point
│   │   └── app.css         global styles + CSS variables
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── .env.example
├── .gitignore
└── README.md
```

---

## Local Development

### Prerequisites

- Node.js 18+
- MongoDB Atlas cluster
- Brevo account (free) — for OTP emails
- Groq API key (free at console.groq.com) — for AI features

### Setup

```bash
cd finsight
npm run setup          # installs all dependencies (root + server + client)

cp server/.env.example server/.env
# fill in your values (see Environment Variables below)

npm run dev            # starts both server (5001) and client (5173)
```

### Environment Variables

**`server/.env`**
```
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/finsight
JWT_SECRET=<64 random characters>
GROQ_API_KEY=gsk_...
CLIENT_URL=http://localhost:5173
BREVO_API_KEY=<your brevo api key>
BREVO_FROM=<your verified sender email>
BREVO_SENDER_NAME=FinSight
```

**`client/.env`** (only needed if not using Vite proxy)
```
VITE_API_URL=http://localhost:5001
```

---

## Deployment (Render)

### Backend — Web Service

| Setting | Value |
|---|---|
| Root Directory | `server` |
| Build Command | `npm install` |
| Start Command | `node index.js` |

Environment variables to add in Render dashboard:
```
PORT=5001
NODE_ENV=production
MONGODB_URI=...
JWT_SECRET=...
GROQ_API_KEY=...
CLIENT_URL=https://your-frontend.onrender.com
BREVO_API_KEY=...
BREVO_FROM=...
BREVO_SENDER_NAME=FinSight
```

### Frontend — Static Site

| Setting | Value |
|---|---|
| Root Directory | `client` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

Environment variables to add in Render dashboard:
```
VITE_API_URL=https://your-backend.onrender.com
```

> `VITE_API_URL` is baked into the JS bundle at build time by Vite. After changing it, always do **"Clear build cache & deploy"** in Render.

---

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens expire in 7 days
- OTP required on every login — 10 min expiry, 5-attempt lockout, 30 min ban
- Rate limiting: 30 req/15min auth, 20 req/min AI, 500 req/15min general
- CORS restricted to known frontend origin only
- MongoDB injection protection (express-mongo-sanitize)
- Helmet.js security headers
- Future-dated transactions blocked server-side
- All localStorage keys namespaced per user to prevent data leakage across accounts

---

## Changelog & Technical Decisions

### Email — Brevo HTTP API instead of SMTP

The app originally used Gmail SMTP via nodemailer. This was replaced with Brevo for two reasons:

- **Render free tier blocks SMTP ports** — both port 465 and 587 time out. There is no workaround on the free plan.
- **Gmail requires App Passwords** — needs 2FA enabled on the Google account and a 16-character app-specific password, which adds friction and breaks if 2FA settings change.

Brevo's HTTP API sends email over port 443 (standard HTTPS) which is never blocked. The free tier allows 300 emails/day with no domain required. The fix required changing only `server/utils/mailer.js` — no new packages, no changes to any other file.

### SPA Routing — `client/public/_redirects`

FinSight is a Single Page Application. Only one real file exists on the server: `index.html`. All routes (`/tx`, `/budgets`, `/ai` etc.) are handled by React Router entirely in the browser.

Without the `_redirects` file, Render returns 404 for any URL that isn't exactly `/`. This breaks page refresh, direct URL visits, and password reset links sent by email.

The file `client/public/_redirects` contains one line:
```
/*    /index.html    200
```

Vite copies everything in `public/` into `dist/` at build time. Render reads `_redirects` from the root of the publish directory and applies the redirect rule automatically.

**Important:** Render's Static Site must have **Root Directory set to `client`** and **Publish Directory set to `dist`**. If Root Directory is blank or set to the repo root, Render builds from the wrong folder and never finds the correct `dist/` output.

### `VITE_API_URL` — build-time variable

Unlike runtime environment variables, `VITE_API_URL` is replaced inside the JS source code at build time by Vite. If it is added to Render after the first build, the already-compiled bundle still has an empty string baked in. A new build must be triggered after any change to this variable.