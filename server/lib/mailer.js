const nodemailer = require('nodemailer');
const dns = require('dns');

// Strip spaces from app password — Google accepts them with or without spaces,
// but some SMTP relay layers reject them. This ensures maximum compatibility.
const gmailUser = process.env.GMAIL_USER;
const gmailPass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s/g, '');

if (!gmailUser || !gmailPass) {
  console.error('[Email] ⚠️  GMAIL_USER or GMAIL_APP_PASSWORD is missing from environment variables!');
  console.error('[Email] ⚠️  GMAIL_USER:', gmailUser ? 'SET ✓' : 'MISSING ✗');
  console.error('[Email] ⚠️  GMAIL_APP_PASSWORD:', gmailPass ? 'SET ✓' : 'MISSING ✗');
} else {
  console.log(`[Email] 🔧 Initializing Gmail SMTP as ${gmailUser} (password length: ${gmailPass.length})`);
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: gmailUser,
    pass: gmailPass,
  },
  connectionTimeout: 5000, // 5 seconds
  greetingTimeout: 5000,
  socketTimeout: 5000,
  // Force IPv4 lookup because Render's container network does not route IPv6
  lookup: (hostname, options, callback) => {
    dns.lookup(hostname, { family: 4 }, callback);
  },
});

// Verify connection on server start — log clearly whether it works
transporter.verify((error) => {
  if (error) {
    console.error('[Email] ❌ Gmail SMTP connection FAILED:', error.message);
    console.error('[Email] ❌ Check GMAIL_USER and GMAIL_APP_PASSWORD in your environment variables.');
  } else {
    console.log('[Email] ✅ Gmail SMTP service ready — emails will be sent successfully');
  }
});

/**
 * Send an email via Gmail SMTP.
 * This NEVER throws — it returns { success, messageId?, error? }
 */
const sendEmail = async ({ to, subject, html }) => {
  if (!to) {
    console.error(`[Email] ❌ No recipient address for "${subject}" — email skipped`);
    return { success: false, error: 'No recipient address' };
  }
  try {
    const info = await transporter.sendMail({
      from: `"GolfGives" <${gmailUser}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] ✅ Sent "${subject}" → ${to} (${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email] ❌ Failed "${subject}" → ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail, transporter };
