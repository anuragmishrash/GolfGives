/**
 * GolfGives Email Service
 * Powered by Nodemailer + Gmail SMTP
 * Dark premium theme: #0a0a0a bg, #22c55e green accent
 */

const { sendEmail } = require('../lib/mailer');

// Force all email links to point to the deployed Vercel frontend
const CLIENT_URL = 'https://golf-gives-theta.vercel.app';
const SUPPORT_EMAIL = process.env.GMAIL_USER || 'support@golfgives.com';

// ── BASE TEMPLATE ──────────────────────────────────────────────────────────────
function baseTemplate(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GolfGives</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #0a0a0a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #ffffff;
    }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header {
      text-align: center;
      padding: 32px 0 24px;
      border-bottom: 1px solid #1a1a1a;
    }
    .logo { font-size: 24px; font-weight: 700; color: #22c55e; letter-spacing: -0.5px; }
    .logo span { color: #ffffff; }
    .tagline { color: #52525b; font-size: 12px; margin-top: 6px; letter-spacing: 1px; text-transform: uppercase; }
    .card {
      background: #111111;
      border: 1px solid #1f1f1f;
      border-radius: 16px;
      padding: 32px;
      margin: 32px 0;
    }
    .badge {
      display: inline-block;
      background: rgba(34, 197, 94, 0.1);
      color: #22c55e;
      border: 1px solid rgba(34, 197, 94, 0.2);
      border-radius: 100px;
      padding: 4px 14px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 20px;
    }
    .badge-red {
      background: rgba(239, 68, 68, 0.1);
      color: #f87171;
      border-color: rgba(239, 68, 68, 0.2);
    }
    h1 { font-size: 26px; font-weight: 700; color: #ffffff; line-height: 1.3; margin-bottom: 12px; }
    p { font-size: 15px; color: #a1a1aa; line-height: 1.7; margin-bottom: 16px; }
    .highlight { color: #ffffff; font-weight: 600; }
    .btn {
      display: inline-block;
      background: #22c55e;
      color: #000000 !important;
      font-weight: 700;
      font-size: 15px;
      padding: 14px 32px;
      border-radius: 100px;
      text-decoration: none;
      margin-top: 8px;
    }
    .btn-outline {
      display: inline-block;
      background: transparent;
      color: #ffffff !important;
      font-weight: 600;
      font-size: 15px;
      padding: 13px 32px;
      border-radius: 100px;
      border: 1px solid #333333;
      text-decoration: none;
      margin-top: 8px;
    }
    .stat-row { display: flex; gap: 16px; margin: 20px 0; }
    .stat-box {
      flex: 1;
      background: #1a1a1a;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }
    .stat-value { font-size: 22px; font-weight: 700; color: #22c55e; }
    .stat-label { font-size: 11px; color: #71717a; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .divider { border: none; border-top: 1px solid #1f1f1f; margin: 24px 0; }
    .info-box {
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 12px;
      padding: 18px 20px;
      margin: 16px 0;
    }
    .info-box p { margin: 4px 0; font-size: 14px; }
    .success-box {
      background: rgba(34, 197, 94, 0.08);
      border: 1px solid rgba(34, 197, 94, 0.2);
      border-radius: 12px;
      padding: 16px 20px;
      color: #22c55e;
      font-size: 14px;
      margin-top: 16px;
    }
    .warning-box {
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 12px;
      padding: 16px 20px;
      color: #f87171;
      font-size: 14px;
      margin-top: 16px;
    }
    .number-ball {
      display: inline-block;
      width: 46px; height: 46px;
      background: #22c55e;
      color: #000;
      font-weight: 700;
      font-size: 17px;
      border-radius: 50%;
      line-height: 46px;
      text-align: center;
      margin: 4px;
    }
    .steps { padding-left: 0; list-style: none; }
    .steps li {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
      font-size: 14px;
      color: #a1a1aa;
    }
    .step-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px; height: 24px;
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 50%;
      font-size: 12px;
      font-weight: 700;
      color: #22c55e;
      flex-shrink: 0;
    }
    .footer {
      text-align: center;
      padding-top: 24px;
      border-top: 1px solid #1a1a1a;
    }
    .footer p { font-size: 12px; color: #3f3f46; line-height: 1.6; }
    .footer a { color: #22c55e; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">Golf<span>Gives</span></div>
      <div class="tagline">Play Golf · Give Back · Win Big</div>
    </div>
    ${content}
    <div class="footer">
      <p>© 2026 GolfGives. All rights reserved.</p>
      <p style="margin-top:8px">
        Questions? <a href="mailto:${SUPPORT_EMAIL}">Contact Support</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ── HELPER ────────────────────────────────────────────────────────────────────
function formatDate(dateVal) {
  const d = new Date(typeof dateVal === 'number' && dateVal < 1e12
    ? dateVal * 1000
    : dateVal);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ════════════════════════════════════════════════════════════════════════════
// 1. WELCOME EMAIL — after signup
// ════════════════════════════════════════════════════════════════════════════
async function sendWelcomeEmail({ name, email }) {
  const html = baseTemplate(`
    <div class="card">
      <div class="badge">Welcome</div>
      <h1>Welcome to GolfGives, ${name} 👋</h1>
      <p>You've joined a community where golf meets purpose.
         Every score you enter is a chance to win — and every
         subscription supports a charity you care about.</p>
      <hr class="divider">
      <p><span class="highlight">Here's what to do next:</span></p>
      <ul class="steps">
        <li><span class="step-num">1</span> Choose your charity in Settings</li>
        <li><span class="step-num">2</span> Subscribe to enter monthly draws</li>
        <li><span class="step-num">3</span> Enter your last 5 golf scores</li>
        <li><span class="step-num">4</span> Wait for the monthly draw results</li>
      </ul>
      <br>
      <a href="${CLIENT_URL}/dashboard" class="btn">Go to Dashboard →</a>
    </div>
  `);

  return sendEmail({ to: email, subject: '👋 Welcome to GolfGives', html });
}

// ════════════════════════════════════════════════════════════════════════════
// 2. SUBSCRIPTION ACTIVATED — after Stripe payment succeeds
// ════════════════════════════════════════════════════════════════════════════
async function sendSubscriptionActivatedEmail({ name, email, plan, renewalDate, charityName, charityAmount }) {
  const planLabel = plan === 'yearly' ? 'Yearly' : 'Monthly';
  const renewalFormatted = formatDate(renewalDate);
  const months = plan === 'yearly' ? '12' : '1';

  const html = baseTemplate(`
    <div class="card">
      <div class="badge">Subscription Active</div>
      <h1>You're in, ${name}!</h1>
      <p>Your <span class="highlight">${planLabel} plan</span> is now active.
         You're eligible to enter monthly draws and support your chosen charity.</p>
      <div class="stat-row">
        <div class="stat-box">
          <div class="stat-value">${months}</div>
          <div class="stat-label">Month${months === '1' ? '' : 's'}</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${charityAmount ? `£${charityAmount}` : '10%'}</div>
          <div class="stat-label">Charity Cut</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">Active</div>
          <div class="stat-label">Status</div>
        </div>
      </div>
      <div class="info-box">
        <p><span class="highlight">Next renewal:</span> ${renewalFormatted}</p>
        ${charityName ? `<p style="margin-top:8px"><span class="highlight">Charity:</span> ${charityName}</p>` : ''}
      </div>
      <div class="success-box">
        ✓ Enter your 5 golf scores now to be eligible for this month's draw.
      </div>
      <br>
      <a href="${CLIENT_URL}/dashboard/scores" class="btn">Enter Scores →</a>
    </div>
  `);

  return sendEmail({ to: email, subject: '✅ Your GolfGives Subscription is Active', html });
}

// ════════════════════════════════════════════════════════════════════════════
// 3. DRAW PUBLISHED — sent to all active subscribers
// ════════════════════════════════════════════════════════════════════════════
async function sendDrawPublishedEmail({ name, email, month, participated, matchType, prizeAmount }) {
  let badgeHtml = '<div class="badge">Draw Results</div>';
  let bodyHtml = '';

  if (!participated) {
    bodyHtml = `
      <h1>${month} Draw Results Are In</h1>
      <p>Hi ${name}, you weren't entered in this month's draw because you didn't have 5 scores submitted.</p>
      <div class="info-box">
        <p>Make sure your 5 scores are entered before the next draw closes at month-end!</p>
      </div>
      <br>
      <a href="${CLIENT_URL}/dashboard/scores" class="btn">Enter Scores →</a>
    `;
  } else if (!matchType) {
    bodyHtml = `
      <h1>Good effort this month, ${name}</h1>
      <p>You were entered in the ${month} draw but didn't match enough numbers this time.</p>
      <p>Keep entering your scores — next month could be yours!</p>
      <br>
      <a href="${CLIENT_URL}/dashboard/draws" class="btn-outline">View Draw Results</a>
    `;
  } else {
    const isJackpot = matchType === '5-match';
    const matchNum = matchType[0];
    bodyHtml = `
      <h1>${isJackpot ? '🏆 JACKPOT! You won the 5-match!' : `🎉 You matched ${matchNum} numbers!`}</h1>
      <p>Hi ${name}, the ${month} draw results are in and you've won!</p>
      <div class="stat-row">
        <div class="stat-box">
          <div class="stat-value" style="color:${isJackpot ? '#f59e0b' : '#22c55e'}">£${Number(prizeAmount).toFixed(2)}</div>
          <div class="stat-label">Prize Amount</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${matchType}</div>
          <div class="stat-label">Match Type</div>
        </div>
      </div>
      <div class="success-box">
        Upload your score verification proof to claim your prize within 14 days.
      </div>
      <br>
      <a href="${CLIENT_URL}/dashboard/winnings" class="btn">Claim Your Prize →</a>
    `;
  }

  const html = baseTemplate(`<div class="card">${badgeHtml}${bodyHtml}</div>`);
  const subject = participated && matchType
    ? `🏆 You won £${Number(prizeAmount).toFixed(2)} in the ${month} draw!`
    : `🏌️ ${month} Draw Results — GolfGives`;

  return sendEmail({ to: email, subject, html });
}

// ════════════════════════════════════════════════════════════════════════════
// 4. WINNER VERIFICATION REQUEST — prompt to upload proof
// ════════════════════════════════════════════════════════════════════════════
async function sendWinnerVerificationRequestEmail({ name, email, matchType, prizeAmount }) {
  const html = baseTemplate(`
    <div class="card">
      <div class="badge">🏆 You Won</div>
      <h1>Congratulations, ${name}!</h1>
      <p>You've won the <span class="highlight">${matchType}</span>
         prize in this month's GolfGives draw!</p>
      <div class="stat-row">
        <div class="stat-box">
          <div class="stat-value">£${Number(prizeAmount).toFixed(2)}</div>
          <div class="stat-label">Prize Amount</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${matchType}</div>
          <div class="stat-label">Match Type</div>
        </div>
      </div>
      <hr class="divider">
      <p><span class="highlight">To claim your prize:</span></p>
      <ul class="steps">
        <li><span class="step-num">1</span> Upload a screenshot of your scores from your golf platform</li>
        <li><span class="step-num">2</span> Our team will verify within 48 hours</li>
        <li><span class="step-num">3</span> Payment will be processed after approval</li>
      </ul>
      <p style="font-size:13px;color:#52525b;margin-top:12px">
        ⚠️ Verification must be submitted within 14 days.
      </p>
      <br>
      <a href="${CLIENT_URL}/dashboard/winnings" class="btn">Upload Proof Now →</a>
    </div>
  `);

  return sendEmail({
    to: email,
    subject: `🏆 You Won! Claim Your GolfGives Prize — £${Number(prizeAmount).toFixed(2)}`,
    html,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 5. WINNER APPROVED — proof verified, payment processing
// ════════════════════════════════════════════════════════════════════════════
async function sendWinnerApprovedEmail({ name, email, prizeAmount, paymentMethod }) {
  const html = baseTemplate(`
    <div class="card">
      <div class="badge">Verified ✓</div>
      <h1>Your proof has been approved, ${name}!</h1>
      <p>Our team has reviewed and approved your winning submission.
         Your prize payment is now being processed.</p>
      <div class="success-box">
        <strong>£${Number(prizeAmount).toFixed(2)}</strong> will be transferred to you
        within 3–5 business days${paymentMethod ? ` via ${paymentMethod}` : ''}.
      </div>
      <hr class="divider">
      <p>Thank you for being part of the GolfGives community.
         Keep playing, keep giving.</p>
      <br>
      <a href="${CLIENT_URL}/dashboard/winnings" class="btn">View Winnings →</a>
    </div>
  `);

  return sendEmail({
    to: email,
    subject: '✅ Prize Verification Approved — GolfGives',
    html,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 6. WINNER REJECTED — proof not accepted
// ════════════════════════════════════════════════════════════════════════════
async function sendWinnerRejectedEmail({ name, email, prizeAmount, adminNote }) {
  const reason = adminNote || 'The submitted proof did not match the required format or score data.';
  const html = baseTemplate(`
    <div class="card">
      <div class="badge badge-red">Verification Failed</div>
      <h1>Submission Not Approved</h1>
      <p>Hi ${name}, unfortunately we were unable to verify your
         winning submission${prizeAmount ? ` for £${Number(prizeAmount).toFixed(2)}` : ''}.</p>
      <div class="warning-box">
        <strong>Reason:</strong> ${reason}
      </div>
      <hr class="divider">
      <p>If you believe this is an error, please contact our
         support team with your original score screenshots.</p>
      <br>
      <a href="mailto:${SUPPORT_EMAIL}" class="btn-outline">Contact Support</a>
    </div>
  `);

  return sendEmail({
    to: email,
    subject: '❌ Proof Submission Not Approved — GolfGives',
    html,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 7. SUBSCRIPTION CANCELLED — user or webhook cancelled
// ════════════════════════════════════════════════════════════════════════════
async function sendSubscriptionCancelledEmail({ name, email, accessUntil }) {
  const accessFormatted = accessUntil ? formatDate(accessUntil) : 'end of current period';
  const html = baseTemplate(`
    <div class="card">
      <div class="badge badge-red">Subscription Cancelled</div>
      <h1>We're sorry to see you go, ${name}</h1>
      <p>Your subscription has been cancelled. You'll retain full
         access to GolfGives until:</p>
      <div style="text-align:center;font-size:22px;font-weight:700;color:#ffffff;
                  margin:20px 0;padding:20px;background:#1a1a1a;border-radius:12px;">
        ${accessFormatted}
      </div>
      <p>After this date, your account will revert to free access
         and you won't be eligible for monthly draws.</p>
      <hr class="divider">
      <p>Changed your mind? Reactivate anytime — your scores and history are saved.</p>
      <br>
      <a href="${CLIENT_URL}/subscribe" class="btn">Reactivate Subscription →</a>
    </div>
  `);

  return sendEmail({
    to: email,
    subject: 'Subscription Cancelled — GolfGives',
    html,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 8. PAYMENT FAILED — invoice payment failure
// ════════════════════════════════════════════════════════════════════════════
async function sendPaymentFailedEmail({ name, email, amount, retryDate }) {
  const html = baseTemplate(`
    <div class="card">
      <div class="badge badge-red">Payment Failed</div>
      <h1>We couldn't process your payment</h1>
      <p>Hi ${name}, your subscription payment of
         <span class="highlight">£${amount}</span> failed.</p>
      <div class="warning-box">
        Your subscription has been paused. Update your payment method to continue
        entering scores and participating in draws.
        ${retryDate ? `<br><br>Stripe will retry automatically on <strong>${retryDate}</strong>.` : ''}
      </div>
      <hr class="divider">
      <p>Update your payment details now to avoid losing access.</p>
      <br>
      <a href="${CLIENT_URL}/subscribe" class="btn">Update Payment Method →</a>
    </div>
  `);

  return sendEmail({
    to: email,
    subject: '⚠️ Payment Failed — Action Required — GolfGives',
    html,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 9. RENEWAL REMINDER — 3 days before next billing
// ════════════════════════════════════════════════════════════════════════════
async function sendSubscriptionRenewalReminderEmail({ name, email, plan, renewalDate, amount }) {
  const planLabel = plan === 'yearly' ? 'Yearly' : 'Monthly';
  const renewalFormatted = formatDate(renewalDate);

  const html = baseTemplate(`
    <div class="card">
      <div class="badge">Renewal Reminder</div>
      <h1>Just a heads up, ${name}</h1>
      <p>Your GolfGives subscription renews in 3 days.</p>
      <div class="info-box">
        <p><span class="highlight">Plan:</span> ${planLabel}</p>
        <p style="margin-top:8px"><span class="highlight">Amount:</span> ${amount}</p>
        <p style="margin-top:8px"><span class="highlight">Renewal Date:</span> ${renewalFormatted}</p>
      </div>
      <p>No action needed — we'll handle this automatically. To cancel, visit your settings before the renewal date.</p>
      <br>
      <a href="${CLIENT_URL}/dashboard/settings" class="btn">Manage Subscription →</a>
    </div>
  `);

  return sendEmail({
    to: email,
    subject: '⏰ Your GolfGives subscription renews in 3 days',
    html,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 10. PAYOUT COMPLETED — payment has been sent to winner
// ════════════════════════════════════════════════════════════════════════════
async function sendPayoutCompletedEmail({ name, email, prizeAmount, paymentReference }) {
  const html = baseTemplate(`
    <div class="card">
      <div class="badge">Payment Sent ✓</div>
      <h1>Payment sent, ${name}!</h1>
      <div class="info-box">
        <p><span class="highlight">Amount Paid:</span> £${Number(prizeAmount).toFixed(2)}</p>
        ${paymentReference ? `<p style="margin-top:8px"><span class="highlight">Reference:</span> ${paymentReference}</p>` : ''}
        <p style="margin-top:8px;color:#22c55e"><strong>Status: Paid ✅</strong></p>
      </div>
      <p>Thank you for playing — and for supporting charity through GolfGives.
         Your contribution makes a real difference.</p>
      <br>
      <a href="${CLIENT_URL}/dashboard/winnings" class="btn">View Winnings History →</a>
    </div>
  `);

  return sendEmail({
    to: email,
    subject: '💰 Your GolfGives prize payment has been sent!',
    html,
  });
}

// ── EXPORTS ───────────────────────────────────────────────────────────────────
module.exports = {
  sendWelcomeEmail,
  sendSubscriptionActivatedEmail,
  sendSubscriptionCancelledEmail,
  sendSubscriptionRenewalReminderEmail,
  sendPaymentFailedEmail,
  sendDrawPublishedEmail,
  sendWinnerVerificationRequestEmail,
  sendWinnerApprovedEmail,
  sendWinnerRejectedEmail,
  sendPayoutCompletedEmail,
};
