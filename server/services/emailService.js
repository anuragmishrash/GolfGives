const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM;
const CLIENT_URL = process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/$/, '') : 'http://localhost:5173';

function baseTemplate(content) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>GolfGives</title>
  </head>
  <body style="margin:0;padding:0;background:#0a0a0f;font-family:'DM Sans',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" 
           style="background:#0a0a0f;padding:40px 20px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0"
                 style="background:#111118;border-radius:16px;
                        border:1px solid rgba(255,255,255,0.08);
                        overflow:hidden;max-width:600px;width:100%;">
            
            <!-- HEADER -->
            <tr>
              <td style="background:linear-gradient(135deg,#064e3b,#065f46);
                         padding:32px 40px;text-align:center;">
                <h1 style="margin:0;color:#f5f0eb;font-size:28px;
                           font-weight:700;letter-spacing:-0.5px;">
                  ⛳ GolfGives
                </h1>
                <p style="margin:8px 0 0;color:#6ee7b7;font-size:13px;
                          letter-spacing:1px;text-transform:uppercase;">
                  Play Golf · Give Back · Win Big
                </p>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td style="padding:40px;">
                ${content}
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);
                         text-align:center;">
                <p style="margin:0;color:#4b5563;font-size:12px;line-height:1.6;">
                  You're receiving this because you have an account at GolfGives.<br/>
                  © 2026 GolfGives · All rights reserved.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

// 1. sendWelcomeEmail
async function sendWelcomeEmail({ name, email }) {
  try {
    const html = baseTemplate(`
      <h2 style="color:#f5f0eb; font-size:24px; font-weight:700; margin:0 0 12px;">You're in. Let's play.</h2>
      <p style="color:#9ca3af; font-size:15px; line-height:1.7; margin:0 0 24px;">
        Welcome to GolfGives, ${name}! The process is simple: subscribe, enter your golf scores, and get a chance to win monthly prizes while giving back to charity.
      </p>
      <div style="background:#1a1a24; border-radius:12px; padding:20px 24px; border:1px solid rgba(255,255,255,0.06); margin:0 0 20px;">
        <p style="margin:0; color:#f5f0eb;"><strong>Next step:</strong> Activate your subscription to start entering scores.</p>
      </div>
      <p style="color:#9ca3af; font-size:15px; line-height:1.7; margin:0 0 24px;">
        Together, we can make a <span style="color:#10b981; font-weight:600;">real impact</span> through the game we love.
      </p>
      <a href="${CLIENT_URL}/dashboard/overview" style="display:inline-block; background:#10b981; color:#fff; padding:14px 32px; border-radius:50px; text-decoration:none; font-weight:600; font-size:15px; margin-top:8px;">Go to Your Dashboard</a>
    `);
    
    console.log(`[Email] Sending welcome email to ${email}`);
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Welcome to GolfGives, ${name}! 🎉`,
      html
    });
    console.log(`[Email] ✅ Sent welcome email to ${email}`);
    return { success: true };
  } catch (error) {
    console.error(`[Email] ❌ Failed welcome email to ${email}:`, error.message);
    return { success: false };
  }
}

// 2. sendSubscriptionActivatedEmail
async function sendSubscriptionActivatedEmail({ name, email, plan, renewalDate, charityName, charityAmount }) {
  try {
    const html = baseTemplate(`
      <h2 style="color:#f5f0eb; font-size:24px; font-weight:700; margin:0 0 12px;">You're officially a GolfGives member.</h2>
      <div style="background:#1a1a24; border-radius:12px; padding:20px 24px; border:1px solid rgba(255,255,255,0.06); margin:0 0 20px;">
        <p style="margin:0 0 8px; color:#f5f0eb;"><strong>Plan:</strong> ${plan === 'yearly' ? 'Yearly' : 'Monthly'}</p>
        <p style="margin:0 0 8px; color:#f5f0eb;"><strong>Status:</strong> <span style="color:#10b981;">Active</span></p>
        <p style="margin:0; color:#f5f0eb;"><strong>Next Renewal:</strong> ${new Date(renewalDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
      <div style="background:#1a1a24; border-radius:12px; padding:20px 24px; border:1px solid rgba(255,255,255,0.06); margin:0 0 20px;">
        <p style="margin:0; color:#f5f0eb;">£${charityAmount} from your subscription goes to <strong>${charityName}</strong> every month.</p>
      </div>
      <p style="color:#9ca3af; font-size:15px; line-height:1.7; margin:0 0 24px;">
        You can now enter your golf scores and participate in monthly draws.
      </p>
      <a href="${CLIENT_URL}/dashboard/scores" style="display:inline-block; background:#10b981; color:#fff; padding:14px 32px; border-radius:50px; text-decoration:none; font-weight:600; font-size:15px; margin-top:8px;">Enter Your Scores</a>
    `);

    console.log(`[Email] Sending subscription activated email to ${email}`);
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Subscription activated — you're now in the draw! ✅",
      html
    });
    console.log(`[Email] ✅ Sent subscription activated email to ${email}`);
    return { success: true };
  } catch (error) {
    console.error(`[Email] ❌ Failed subscription activated email to ${email}:`, error.message);
    return { success: false };
  }
}

// 3. sendSubscriptionRenewalReminderEmail
async function sendSubscriptionRenewalReminderEmail({ name, email, plan, renewalDate, amount }) {
  try {
    const html = baseTemplate(`
      <h2 style="color:#f5f0eb; font-size:24px; font-weight:700; margin:0 0 12px;">Just a heads up, ${name}.</h2>
      <div style="background:#1a1a24; border-radius:12px; padding:20px 24px; border:1px solid rgba(255,255,255,0.06); margin:0 0 20px;">
        <p style="margin:0 0 8px; color:#f5f0eb;"><strong>Plan:</strong> ${plan === 'yearly' ? 'Yearly' : 'Monthly'}</p>
        <p style="margin:0 0 8px; color:#f5f0eb;"><strong>Amount:</strong> ${amount}</p>
        <p style="margin:0; color:#f5f0eb;"><strong>Renewal Date:</strong> ${new Date(renewalDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
      <p style="color:#9ca3af; font-size:15px; line-height:1.7; margin:0 0 24px;">
        No action needed — we'll handle this automatically. To cancel, visit your settings before the renewal date.
      </p>
      <a href="${CLIENT_URL}/dashboard/settings" style="display:inline-block; background:#10b981; color:#fff; padding:14px 32px; border-radius:50px; text-decoration:none; font-weight:600; font-size:15px; margin-top:8px;">Manage Subscription</a>
    `);

    console.log(`[Email] Sending renewal reminder email to ${email}`);
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Your GolfGives subscription renews in 3 days",
      html
    });
    console.log(`[Email] ✅ Sent renewal reminder email to ${email}`);
    return { success: true };
  } catch (error) {
    console.error(`[Email] ❌ Failed renewal reminder email to ${email}:`, error.message);
    return { success: false };
  }
}

// 4. sendSubscriptionCancelledEmail
async function sendSubscriptionCancelledEmail({ name, email, accessUntil }) {
  try {
    const html = baseTemplate(`
      <h2 style="color:#f5f0eb; font-size:24px; font-weight:700; margin:0 0 12px;">Sorry to see you go, ${name}.</h2>
      <div style="background:#1a1a24; border-radius:12px; padding:20px 24px; border:1px solid rgba(255,255,255,0.06); margin:0 0 20px;">
        <p style="margin:0; color:#f5f0eb;">You still have access until <strong>${new Date(accessUntil * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.</p>
      </div>
      <p style="color:#9ca3af; font-size:15px; line-height:1.7; margin:0 0 24px;">
        Your scores and draw history are saved. Come back anytime. Your charity contributions made a real difference — thank you.
      </p>
      <a href="${CLIENT_URL}/subscribe" style="display:inline-block; background:#10b981; color:#fff; padding:14px 32px; border-radius:50px; text-decoration:none; font-weight:600; font-size:15px; margin-top:8px;">Resubscribe</a>
    `);

    console.log(`[Email] Sending subscription cancelled email to ${email}`);
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Your GolfGives subscription has been cancelled",
      html
    });
    console.log(`[Email] ✅ Sent subscription cancelled email to ${email}`);
    return { success: true };
  } catch (error) {
    console.error(`[Email] ❌ Failed subscription cancelled email to ${email}:`, error.message);
    return { success: false };
  }
}

// 5. sendPaymentFailedEmail
async function sendPaymentFailedEmail({ name, email, amount, retryDate }) {
  try {
    const html = baseTemplate(`
      <h2 style="color:#f5f0eb; font-size:24px; font-weight:700; margin:0 0 12px;">We couldn't process your payment.</h2>
      <div style="background:#2d1b1b; border-radius:12px; padding:20px 24px; border:1px solid #ef4444; margin:0 0 20px;">
        <p style="margin:0 0 8px; color:#f5f0eb;"><strong>Amount:</strong> £${amount}</p>
        <p style="margin:0; color:#ef4444;"><strong>Status: Failed</strong></p>
      </div>
      <p style="color:#9ca3af; font-size:15px; line-height:1.7; margin:0 0 24px;">
        Your subscription has been paused. Update your payment method to continue entering scores and participating in draws. Stripe will retry automatically on ${retryDate}.
      </p>
      <a href="${CLIENT_URL}/subscribe" style="display:inline-block; background:#10b981; color:#fff; padding:14px 32px; border-radius:50px; text-decoration:none; font-weight:600; font-size:15px; margin-top:8px;">Update Payment Method</a>
    `);

    console.log(`[Email] Sending payment failed email to ${email}`);
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "⚠️ Payment failed — action required",
      html
    });
    console.log(`[Email] ✅ Sent payment failed email to ${email}`);
    return { success: true };
  } catch (error) {
    console.error(`[Email] ❌ Failed payment failed email to ${email}:`, error.message);
    return { success: false };
  }
}

// 6. sendDrawPublishedEmail
async function sendDrawPublishedEmail({ name, email, month, participated, matchType, prizeAmount }) {
  try {
    let subject = `${month} Draw Results Are In! 🏆`;
    let content = '';

    if (!participated) {
      content = `
        <h2 style="color:#f5f0eb; font-size:24px; font-weight:700; margin:0 0 12px;">${month} Draw Results</h2>
        <p style="color:#9ca3af; font-size:15px; line-height:1.7; margin:0 0 24px;">
          You didn't participate in this month's draw — make sure your 5 scores are entered before the next draw.
        </p>
        <div style="background:#1a1a24; border-radius:12px; padding:20px 24px; border:1px solid rgba(255,255,255,0.06); margin:0 0 20px;">
          <p style="margin:0; color:#f5f0eb;">Enter your scores now to ensure you're in the next one!</p>
        </div>
        <a href="${CLIENT_URL}/dashboard/scores" style="display:inline-block; background:#10b981; color:#fff; padding:14px 32px; border-radius:50px; text-decoration:none; font-weight:600; font-size:15px; margin-top:8px;">Enter Scores Now</a>
      `;
    } else if (participated && !matchType) {
      content = `
        <h2 style="color:#f5f0eb; font-size:24px; font-weight:700; margin:0 0 12px;">Good effort this month, ${name}.</h2>
        <p style="color:#9ca3af; font-size:15px; line-height:1.7; margin:0 0 24px;">
          You were entered in this month's draw but didn't match enough numbers. Keep entering your scores — the jackpot is rolling over!
        </p>
        <a href="${CLIENT_URL}/dashboard/draws" style="display:inline-block; background:#10b981; color:#fff; padding:14px 32px; border-radius:50px; text-decoration:none; font-weight:600; font-size:15px; margin-top:8px;">View Draw Results</a>
      `;
    } else if (matchType === '3-match') {
      content = `
        <h2 style="color:#f5f0eb; font-size:24px; font-weight:700; margin:0 0 12px;">🎉 You matched 3 numbers!</h2>
        <div style="background:#064e3b; border-radius:12px; padding:20px 24px; border:1px solid #10b981; margin:0 0 20px;">
          <p style="margin:0; color:#f5f0eb; font-size:18px;">Prize Amount: <strong>£${Number(prizeAmount).toFixed(2)}</strong></p>
        </div>
        <a href="${CLIENT_URL}/dashboard/winnings" style="display:inline-block; background:#10b981; color:#fff; padding:14px 32px; border-radius:50px; text-decoration:none; font-weight:600; font-size:15px; margin-top:8px;">Claim Your Prize</a>
      `;
    } else if (matchType === '4-match') {
      content = `
        <h2 style="color:#f5f0eb; font-size:24px; font-weight:700; margin:0 0 12px;">🎉 Incredible — you matched 4 numbers!</h2>
        <div style="background:#2d2000; border-radius:12px; padding:20px 24px; border:1px solid #f59e0b; margin:0 0 20px;">
          <p style="margin:0; color:#f59e0b; font-size:20px;"><strong>Prize Amount: £${Number(prizeAmount).toFixed(2)}</strong></p>
        </div>
        <a href="${CLIENT_URL}/dashboard/winnings" style="display:inline-block; background:#10b981; color:#fff; padding:14px 32px; border-radius:50px; text-decoration:none; font-weight:600; font-size:15px; margin-top:8px;">Claim Your Prize</a>
      `;
    } else if (matchType === '5-match') {
      content = `
        <h2 style="color:#f5f0eb; font-size:28px; font-weight:700; margin:0 0 12px; text-transform:uppercase;">YOU WON THE JACKPOT! 🏆</h2>
        <div style="background:#2d2000; border-radius:12px; padding:30px 24px; border:2px solid #f59e0b; margin:0 0 20px; text-align:center;">
          <p style="margin:0; color:#f59e0b; font-size:32px; font-weight:bold;">£${Number(prizeAmount).toFixed(2)}</p>
        </div>
        <p style="color:#f5f0eb; font-size:16px; line-height:1.7; margin:0 0 24px; font-weight:600;">
          Submit your score verification proof to claim your prize.
        </p>
        <a href="${CLIENT_URL}/dashboard/winnings" style="display:inline-block; background:#f59e0b; color:#fff; padding:16px 36px; border-radius:50px; text-decoration:none; font-weight:bold; font-size:16px; margin-top:8px;">Submit Proof Now</a>
      `;
    }

    const html = baseTemplate(content);
    console.log(`[Email] Sending draw published email to ${email}`);
    await resend.emails.send({ from: FROM, to: email, subject, html });
    console.log(`[Email] ✅ Sent draw published email to ${email}`);
    return { success: true };
  } catch (error) {
    console.error(`[Email] ❌ Failed draw published email to ${email}:`, error.message);
    return { success: false };
  }
}

// 7. sendWinnerVerificationRequestEmail
async function sendWinnerVerificationRequestEmail({ name, email, matchType, prizeAmount }) {
  try {
    const html = baseTemplate(`
      <h2 style="color:#f5f0eb; font-size:24px; font-weight:700; margin:0 0 12px;">You won! Now let's verify your score.</h2>
      <div style="background:#1a1a24; border-radius:12px; padding:20px 24px; border:1px solid rgba(255,255,255,0.06); margin:0 0 20px;">
        <p style="margin:0 0 8px; color:#f5f0eb;"><strong>Match Type:</strong> ${matchType}</p>
        <p style="margin:0 0 8px; color:#f5f0eb;"><strong>Prize Amount:</strong> £${Number(prizeAmount).toFixed(2)}</p>
        <p style="margin:0; color:#f59e0b;"><strong>Status: Awaiting Verification</strong></p>
      </div>
      <ol style="color:#9ca3af; font-size:15px; line-height:1.7; margin:0 0 24px; padding-left:20px;">
        <li style="margin-bottom:8px;">Go to your winnings dashboard</li>
        <li style="margin-bottom:8px;">Upload a screenshot of your scores from your golf platform</li>
        <li style="margin-bottom:8px;">Our team will verify within 48 hours</li>
        <li>Payment sent once verified</li>
      </ol>
      <p style="color:#9ca3af; font-size:14px; margin:0 0 24px;"><em>Note: Verification must be submitted within 14 days.</em></p>
      <a href="${CLIENT_URL}/dashboard/winnings" style="display:inline-block; background:#10b981; color:#fff; padding:14px 32px; border-radius:50px; text-decoration:none; font-weight:600; font-size:15px; margin-top:8px;">Upload Proof Now</a>
    `);

    console.log(`[Email] Sending verification request email to ${email}`);
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Action required — verify your win to receive £${prizeAmount}`,
      html
    });
    console.log(`[Email] ✅ Sent verification request email to ${email}`);
    return { success: true };
  } catch (error) {
    console.error(`[Email] ❌ Failed verification request email to ${email}:`, error.message);
    return { success: false };
  }
}

// 8. sendWinnerApprovedEmail
async function sendWinnerApprovedEmail({ name, email, prizeAmount, paymentMethod }) {
  try {
    const html = baseTemplate(`
      <h2 style="color:#f5f0eb; font-size:24px; font-weight:700; margin:0 0 12px;">Verified! Your prize is on its way.</h2>
      <div style="background:#2d2000; border-radius:12px; padding:20px 24px; border:1px solid #f59e0b; margin:0 0 20px;">
        <p style="margin:0 0 8px; color:#f59e0b;"><strong>Prize Amount:</strong> £${Number(prizeAmount).toFixed(2)}</p>
        <p style="margin:0 0 8px; color:#10b981;"><strong>Status: Approved ✅</strong></p>
        <p style="margin:0; color:#f5f0eb;"><strong>Payment:</strong> Processing</p>
      </div>
      <p style="color:#9ca3af; font-size:15px; line-height:1.7; margin:0 0 24px;">
        Expect your payment within 3-5 business days via ${paymentMethod}.
      </p>
      <a href="${CLIENT_URL}/dashboard/winnings" style="display:inline-block; background:#10b981; color:#fff; padding:14px 32px; border-radius:50px; text-decoration:none; font-weight:600; font-size:15px; margin-top:8px;">View Winnings</a>
    `);

    console.log(`[Email] Sending winner approved email to ${email}`);
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "🎉 Your win has been verified — payment incoming!",
      html
    });
    console.log(`[Email] ✅ Sent winner approved email to ${email}`);
    return { success: true };
  } catch (error) {
    console.error(`[Email] ❌ Failed winner approved email to ${email}:`, error.message);
    return { success: false };
  }
}

// 9. sendWinnerRejectedEmail
async function sendWinnerRejectedEmail({ name, email, prizeAmount, adminNote }) {
  try {
    const html = baseTemplate(`
      <h2 style="color:#f5f0eb; font-size:24px; font-weight:700; margin:0 0 12px;">We couldn't verify your submission.</h2>
      <p style="color:#9ca3af; font-size:15px; line-height:1.7; margin:0 0 24px;">
        Unfortunately we were unable to verify your score proof for the £${Number(prizeAmount).toFixed(2)} prize.
      </p>
      ${adminNote ? `
      <div style="background:#1a1a24; border-radius:12px; padding:20px 24px; border:1px solid rgba(255,255,255,0.06); margin:0 0 20px;">
        <p style="margin:0; color:#f5f0eb;"><strong>Reason:</strong> ${adminNote}</p>
      </div>
      ` : ''}
      <p style="color:#9ca3af; font-size:15px; line-height:1.7; margin:0 0 24px;">
        If you believe this is an error, please contact support.
      </p>
      <a href="mailto:support@golfgives.com" style="display:inline-block; background:#374151; color:#fff; padding:14px 32px; border-radius:50px; text-decoration:none; font-weight:600; font-size:15px; margin-top:8px;">Contact Support</a>
    `);

    console.log(`[Email] Sending winner rejected email to ${email}`);
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Update on your prize verification",
      html
    });
    console.log(`[Email] ✅ Sent winner rejected email to ${email}`);
    return { success: true };
  } catch (error) {
    console.error(`[Email] ❌ Failed winner rejected email to ${email}:`, error.message);
    return { success: false };
  }
}

// 10. sendPayoutCompletedEmail
async function sendPayoutCompletedEmail({ name, email, prizeAmount, paymentReference }) {
  try {
    const html = baseTemplate(`
      <h2 style="color:#f5f0eb; font-size:24px; font-weight:700; margin:0 0 12px;">Payment sent, ${name}!</h2>
      <div style="background:#1a1a24; border-radius:12px; padding:20px 24px; border:1px solid rgba(255,255,255,0.06); margin:0 0 20px;">
        <p style="margin:0 0 8px; color:#f5f0eb;"><strong>Amount Paid:</strong> £${Number(prizeAmount).toFixed(2)}</p>
        <p style="margin:0 0 8px; color:#f5f0eb;"><strong>Reference:</strong> ${paymentReference}</p>
        <p style="margin:0; color:#10b981;"><strong>Status: Paid ✅</strong></p>
      </div>
      <p style="color:#9ca3af; font-size:15px; line-height:1.7; margin:0 0 24px;">
        Thank you for playing — and for supporting charity through GolfGives.
      </p>
      <a href="${CLIENT_URL}/dashboard/winnings" style="display:inline-block; background:#10b981; color:#fff; padding:14px 32px; border-radius:50px; text-decoration:none; font-weight:600; font-size:15px; margin-top:8px;">View Winnings History</a>
    `);

    console.log(`[Email] Sending payout completed email to ${email}`);
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "💰 Your GolfGives prize payment has been sent!",
      html
    });
    console.log(`[Email] ✅ Sent payout completed email to ${email}`);
    return { success: true };
  } catch (error) {
    console.error(`[Email] ❌ Failed payout completed email to ${email}:`, error.message);
    return { success: false };
  }
}

module.exports = {
  sendWelcomeEmail,
  sendSubscriptionActivatedEmail,
  sendSubscriptionRenewalReminderEmail,
  sendSubscriptionCancelledEmail,
  sendPaymentFailedEmail,
  sendDrawPublishedEmail,
  sendWinnerVerificationRequestEmail,
  sendWinnerApprovedEmail,
  sendWinnerRejectedEmail,
  sendPayoutCompletedEmail
};
