const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Verify connection on server start
transporter.verify((error) => {
  if (error) {
    console.error('[Email] ❌ Gmail SMTP connection failed:', error.message);
  } else {
    console.log('[Email] ✅ Gmail SMTP service ready');
  }
});

/**
 * Send an email via Gmail SMTP.
 * This NEVER throws — it returns { success, messageId?, error? }
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"GolfGives" <${process.env.GMAIL_USER}>`,
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
