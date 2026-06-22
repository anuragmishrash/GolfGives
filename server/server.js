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
    const { transporter, sendEmail } = require('./lib/mailer');
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    const parsedPass = (gmailPass || '').replace(/\s/g, '');
    const testRecipient = req.query.test;

    // Hard 4-second timeout for verification
    let verifyError = null;
    let smtpVerified = false;
    try {
      const verifyPromise = transporter.verify();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SMTP connection timed out (4s hard limit)')), 4000)
      );
      await Promise.race([verifyPromise, timeoutPromise]);
      smtpVerified = true;
    } catch (err) {
      verifyError = err.message;
    }

    // Optional test email send
    let testResult = null;
    if (testRecipient) {
      try {
        const sendPromise = sendEmail({
          to: testRecipient,
          subject: '⛳ GolfGives SMTP Test Email',
          html: '<p>If you see this, email sending works perfectly from the server! 🎉</p>',
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Send email timed out (4s hard limit)')), 4000)
        );
        testResult = await Promise.race([sendPromise, timeoutPromise]);
      } catch (err) {
        testResult = { success: false, error: err.message };
      }
    }

    res.json({
      success: smtpVerified && (!testRecipient || testResult?.success),
      gmailUser: gmailUser ? `${gmailUser.substring(0, 3)}...${gmailUser.split('@')[1]}` : 'MISSING',
      gmailPassLength: gmailPass ? gmailPass.length : 0,
      gmailPassStrippedLength: parsedPass.length,
      smtpVerified,
      verifyError,
      testResult,
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
