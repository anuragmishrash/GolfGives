# GolfGives 🏌️ — Play Golf. Give Back. Win Big.

A subscription-driven golf performance + charity fundraising + monthly prize draw platform.

### 🌐 Live Deployment
- **Frontend (Vercel):** [https://golf-gives-theta.vercel.app](https://golf-gives-theta.vercel.app)
- **Backend API (Render):** [https://golfgives-api.onrender.com](https://golfgives-api.onrender.com)

---

## 🚀 Tech Stack

**Frontend:** React 18 + Vite + Tailwind CSS + Framer Motion + React Router v6 + Recharts + Lucide React + Axios + React Hook Form + Zod

**Backend:** Node.js + Express.js + MongoDB Atlas + Mongoose + JWT (access + refresh) + Stripe (test mode) + Nodemailer

---

## 📁 Project Structure

```
/client          → React frontend (Vite)
/server          → Express.js backend
```

---

## ⚙️ Setup Instructions

### 1. Backend

```bash
cd server
npm install
```

Create `server/.env` (already generated — fill in real values):
```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...
CLIENT_URL=http://localhost:5173
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your@email.com
EMAIL_PASS=your_app_password
```

#### Setting up Stripe Products
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/products)
2. Create product "GolfGives Monthly" → price £9.99/month → copy Price ID → set `STRIPE_MONTHLY_PRICE_ID`
3. Create product "GolfGives Yearly" → price £99.99/year → copy Price ID → set `STRIPE_YEARLY_PRICE_ID`
Local webhook testing: Install Stripe CLI, run: `stripe listen --forward-to localhost:5000/api/subscriptions/webhook`
Copy the webhook secret and add it to your `.env` as `STRIPE_WEBHOOK_SECRET`.
```bash
npm run dev   # Starts on port 5000
```

### 2. Frontend

```bash
cd client
npm install
npm run dev   # Starts on port 5173
```

---

## 🔑 Test Credentials

### Stripe Test Card
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g. 12/28)
CVC: Any 3 digits (e.g. 123)
```

### Create Admin User
Register normally, then in MongoDB Atlas update the user's `role` field to `"admin"`.

---

## 🎯 Features

### Public
- 🏠 Landing page with animated hero, prize pool counter, how-it-works
- 🤝 Charity directory with search/filter
- 💳 Subscribe page with Monthly/Yearly plan selector → Stripe Checkout
- 🔐 Sign in / Register with JWT auth

### Subscriber Dashboard
- 📊 Overview with prize pool, countdown timer, subscription status
- 🎯 Score tracking (1–45, max 5, rolling window, no duplicate dates)
- 🏆 Draw history with win/loss results and proof upload
- 💰 Winnings history with payment status
- ⚙️ Profile + charity preferences + cancel subscription

### Admin Panel
- 📈 Dashboard with KPI cards + Recharts charts
- 👥 User management with role toggle
- 🎲 Draw management — simulate (preview only) → publish (with confirm guard)
- ❤️ Charity CRUD — logos, banners, events, featured toggle
- 🏅 Winner management — view proofs, approve/reject, mark paid
- 📊 Analytics — subscriptions over time, charity breakdown

---

## 🎨 Design System

- **Background:** Deep obsidian `#0a0a0f`
- **Text:** Warm white `#f5f0eb`
- **Primary:** Emerald `#10b981`
- **Highlight:** Gold `#f59e0b`
- **Typography:** Playfair Display (headings) + DM Sans (body)
- **Cards:** Glassmorphism (1px rgba border + backdrop blur)

---

## 🚢 Deployment

### Frontend → Vercel
- **Framework Preset:** Vite
- **Root Directory:** `client`
- **Environment Variables:**
  - `VITE_API_URL` = `https://golfgives-api.onrender.com`
  - `VITE_STRIPE_PUBLISHABLE_KEY` = `your_stripe_pk`
- The project includes a `vercel.json` file to handle React Router client-side routing.

### Backend → Render
- **Service Type:** Web Service
- **Environment:** Node
- **Root Directory:** `server`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment Variables:**
  - Add all `.env` values, including `RESEND_API_KEY` and `RESEND_FROM`.
  - Set `CLIENT_URL` to `https://golf-gives-theta.vercel.app`.
  - Set `STRIPE_WEBHOOK_SECRET` to the live webhook secret from the Stripe Dashboard.

---

## 📋 Prize Pool Logic

```
totalFee = subscription amount
charityAmount = totalFee × (charityContributionPercent / 100)
remainingAfterCharity = totalFee − charityAmount
prizePoolTotal = remainingAfterCharity × 0.70

prizePool.fiveMatch += prizePoolTotal × 0.40   (40%)
prizePool.fourMatch += prizePoolTotal × 0.35   (35%)
prizePool.threeMatch += prizePoolTotal × 0.25  (25%)

Jackpot rolls over if no 5-match winner that month.
```
