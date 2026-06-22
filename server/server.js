// GolfGives Server Entry Point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const subscriptionRoutes = require('./routes/subscriptions');
const adminRoutes = require('./routes/admin');
const charityRoutes = require('./routes/charities');
const winnerRoutes = require('./routes/winners');
const errorHandler = require('./middleware/errorHandler');
const { startRenewalScheduler } = require('./services/renewalScheduler');

const app = express();
app.set('trust proxy', 1); // trust first proxy (Render load balancer)

// ── Security & Utility Middleware ──────────────────────────────────────────────
app.use(helmet());
app.use(morgan('dev'));
// Build allowed origins list — always include both prod and localhost
const allowedOrigins = [
  'https://golf-gives-theta.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  // also respect CLIENT_URL / FRONTEND_URL env vars in case they differ
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
].filter(Boolean).map(o => o.replace(/\/$/, ''));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Stripe webhooks, Render health checks, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

// Raw body needed for Stripe webhook verification — must be before express.json()
app.use('/api/subscriptions/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Global Rate Limiter ────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// Aggressive rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});
app.use('/api/auth', authLimiter);

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/charities', charityRoutes);
app.use('/api/winners', winnerRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'GolfGives API is running', timestamp: new Date() });
});

// Email configuration health check and test
app.get('/health/email', async (req, res) => {
  try {
    const nodemailer = require('nodemailer');
    const dns = require('dns');
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    const parsedPass = (gmailPass || '').replace(/\s/g, '');

    const transporter465 = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: gmailUser, pass: parsedPass },
      connectionTimeout: 3000,
      greetingTimeout: 3000,
      socketTimeout: 3000,
      lookup: (hostname, options, callback) => dns.lookup(hostname, { family: 4 }, callback),
    });

    const transporter587 = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // STARTTLS
      auth: { user: gmailUser, pass: parsedPass },
      connectionTimeout: 3000,
      greetingTimeout: 3000,
      socketTimeout: 3000,
      lookup: (hostname, options, callback) => dns.lookup(hostname, { family: 4 }, callback),
    });

    // Test port 465
    let err465 = null;
    try {
      await Promise.race([
        transporter465.verify(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout 3s')), 3000))
      ]);
    } catch (err) {
      err465 = err.message;
    }

    // Test port 587
    let err587 = null;
    try {
      await Promise.race([
        transporter587.verify(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout 3s')), 3000))
      ]);
    } catch (err) {
      err587 = err.message;
    }

    res.json({
      gmailUser: gmailUser ? `${gmailUser.substring(0, 3)}...${gmailUser.split('@')[1]}` : 'MISSING',
      gmailPassLength: gmailPass ? gmailPass.length : 0,
      gmailPassStrippedLength: parsedPass.length,
      port465: { verified: err465 === null, error: err465 },
      port587: { verified: err587 === null, error: err587 },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Error Handler ──────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Server Start (no DB connect needed — Supabase is HTTP-based) ──────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 GolfGives API running on port ${PORT}`);
  console.log(`🗄️  Database: Supabase (${process.env.SUPABASE_URL})`);
  startRenewalScheduler();
});

module.exports = app;
