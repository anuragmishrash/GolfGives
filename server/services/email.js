const nodemailer = require('nodemailer');
const User = require('../models/User');
const Draw = require('../models/Draw');

// ── Transporter Setup ──────────────────────────────────────────────────────────
const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

const FROM = `"GolfGives" <${process.env.EMAIL_USER || 'noreply@golfgives.com'}>`;

// ── Email Templates ────────────────────────────────────────────────────────────
const baseLayout = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GolfGives</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:'DM Sans',Arial,sans-serif;color:#f5f0eb;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:28px;font-weight:700;color:#10b981;margin:0;letter-spacing:-0.5px;">GolfGives</h1>
      <p style="font-size:14px;color:#888;margin:4px 0 0;">Play Golf. Give Back. Win Big.</p>
    </div>
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px;">
      ${content}
    </div>
    <div style="text-align:center;margin-top:24px;">
      <p style="font-size:12px;color:#555;margin:0;">© ${new Date().getFullYear()} GolfGives. All rights reserved.</p>
      <p style="font-size:12px;color:#555;margin:4px 0 0;">This email was sent because you are a GolfGives member.</p>
    </div>
  </div>
</body>
</html>
`;

// ── Send Functions ─────────────────────────────────────────────────────────────

/**
 * Welcome email sent on registration
 */
const sendWelcomeEmail = async (user) => {
  const content = `
    <h2 style="font-size:22px;font-weight:600;color:#f5f0eb;margin:0 0 16px;">Welcome to GolfGives, ${user.name}! 🎉</h2>
    <p style="color:#d4cfc9;line-height:1.7;margin:0 0 16px;">
      You've joined a community where your golf scores contribute to something bigger than the game. 
      Every subscription you make helps fund charities and gives you a chance to win monthly prizes.
    </p>
    <p style="color:#d4cfc9;line-height:1.7;margin:0 0 24px;">
      <strong style="color:#f5f0eb;">Next steps:</strong><br>
      1. Subscribe to a monthly or yearly plan<br>
      2. Enter up to 5 of your golf scores (1–45)<br>
      3. Wait for the monthly draw and win big!
    </p>
    <a href="${process.env.CLIENT_URL}/subscribe" 
       style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:600;font-size:15px;">
      Subscribe Now →
    </a>
  `;
  const transporter = createTransporter();
  await transporter.sendMail({
    from: FROM,
    to: user.email,
    subject: `Welcome to GolfGives, ${user.name}!`,
    html: baseLayout(content),
  });
};

/**
 * Subscription activated email
 */
const sendSubscriptionActivatedEmail = async (user, plan) => {
  const content = `
    <h2 style="font-size:22px;font-weight:600;color:#f5f0eb;margin:0 0 16px;">Your Subscription is Active ✅</h2>
    <p style="color:#d4cfc9;line-height:1.7;margin:0 0 16px;">
      Your <strong style="color:#10b981;">${plan} plan</strong> is now active. You're in for this month's draw!
    </p>
    <p style="color:#d4cfc9;line-height:1.7;margin:0 0 24px;">
      Don't forget to enter your 5 golf scores in your dashboard to participate in the monthly draw.
    </p>
    <a href="${process.env.CLIENT_URL}/dashboard" 
       style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:600;font-size:15px;">
      Go to Dashboard →
    </a>
  `;
  const transporter = createTransporter();
  await transporter.sendMail({
    from: FROM,
    to: user.email,
    subject: 'Your GolfGives Subscription is Active!',
    html: baseLayout(content),
  });
};

/**
 * Draw published notification — sent to all participants
 */
const sendDrawPublishedEmail = async (drawId, month, winningNumbers) => {
  const draw = await Draw.findById(drawId).populate('results.userId', 'email name');
  if (!draw) return;

  // Get all active users who participated (had 5 scores)
  const participants = await User.find({ subscriptionStatus: 'active' })
    .select('email name')
    .lean();

  const content = `
    <h2 style="font-size:22px;font-weight:600;color:#f5f0eb;margin:0 0 16px;">Draw Results for ${month} 🏆</h2>
    <p style="color:#d4cfc9;line-height:1.7;margin:0 0 16px;">The monthly GolfGives draw has been completed!</p>
    <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:12px;padding:20px;margin:0 0 20px;">
      <p style="color:#10b981;font-weight:600;margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Winning Numbers</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${winningNumbers.map((n) => `<span style="display:inline-block;width:36px;height:36px;line-height:36px;text-align:center;background:#10b981;color:#fff;border-radius:50%;font-weight:700;">${n}</span>`).join('')}
      </div>
    </div>
    <p style="color:#d4cfc9;line-height:1.7;margin:0 0 24px;">
      Log in to your dashboard to check if you won!
    </p>
    <a href="${process.env.CLIENT_URL}/dashboard" 
       style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:600;font-size:15px;">
      Check Results →
    </a>
  `;

  const transporter = createTransporter();
  for (const participant of participants) {
    await transporter.sendMail({
      from: FROM,
      to: participant.email,
      subject: `GolfGives Draw Results — ${month}`,
      html: baseLayout(content),
    });
  }
};

/**
 * Winner notification email
 */
const sendWinnerEmail = async (userId, month, matchType, prizeAmount) => {
  const user = await User.findById(userId).select('email name').lean();
  if (!user) return;

  const content = `
    <h2 style="font-size:22px;font-weight:600;color:#f59e0b;margin:0 0 16px;">🎉 You Won! Congratulations ${user.name}!</h2>
    <p style="color:#d4cfc9;line-height:1.7;margin:0 0 16px;">
      You matched <strong style="color:#10b981;">${matchType.replace('-', ' ')}</strong> in the ${month} GolfGives Draw!
      Your prize is <strong style="color:#f59e0b;">$${prizeAmount.toFixed(2)}</strong>.
    </p>
    <p style="color:#d4cfc9;line-height:1.7;margin:0 0 24px;">
      To claim your prize, please upload proof of your winning scores to your dashboard. 
      Our team will verify and process your payment within 3–5 business days.
    </p>
    <a href="${process.env.CLIENT_URL}/dashboard" 
       style="display:inline-block;background:#f59e0b;color:#0a0a0f;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:700;font-size:15px;">
      Upload Proof Now →
    </a>
  `;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: FROM,
    to: user.email,
    subject: `🏆 You Won $${prizeAmount.toFixed(2)} in the GolfGives ${month} Draw!`,
    html: baseLayout(content),
  });
};

module.exports = {
  sendWelcomeEmail,
  sendSubscriptionActivatedEmail,
  sendDrawPublishedEmail,
  sendWinnerEmail,
};
