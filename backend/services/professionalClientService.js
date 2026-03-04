const nodemailer = require('nodemailer');
const User = require('../models/User');

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT) || 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

const transporter = smtpHost && smtpUser && smtpPass
  ? nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS) || 5000,
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS) || 5000,
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS) || 7000,
  })
  : null;

async function sendDiyWelcomeEmail({ email, firstName, password }) {
  const safeFirstName = firstName || 'there';

  const html = `
    <p>Hi ${safeFirstName},</p>
    <p>Welcome to WeighBuddy DIY!</p>
    <p>Your login details are:</p>
    <ul>
      <li><strong>Email:</strong> ${email}</li>
      <li><strong>Password:</strong> ${password}</li>
    </ul>
    <p>You can sign in anytime to view your reports and manage your details.</p>
    <p>If you did not expect this email, please contact WeighBuddy support.</p>
  `;

  const sendEmails = String(process.env.SEND_EMAILS || 'true').toLowerCase() === 'true';
  if (!sendEmails) {
    return;
  }

  if (!transporter) {
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `WeighBuddy <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Welcome to WeighBuddy DIY – Your Login Details',
    html,
  });
}

async function createDiyClientFromProfessional({ firstName, lastName, email, phone, password, professionalOwnerUserId }) {
  if (!email || !password) {
    throw new Error('Email and password are required to create DIY client');
  }

  // Check if a user with this email already exists
  let user = await User.findOne({ email });
  if (user) {
    // Do not overwrite existing accounts; just return successfully
    return { user, created: false, emailSent: false };
  }

  const name = [firstName, lastName].filter(Boolean).join(' ').trim() || email;

  user = new User({
    name,
    email,
    phone,
    password,
    userType: 'diy',
    professionalOwnerUserId,
  });

  await user.save();

  // Do not block API response on SMTP. Nginx may time out while waiting.
  // Fire-and-forget the email send, and report emailSent optimistically.
  Promise.resolve()
    .then(() => sendDiyWelcomeEmail({ email, firstName: firstName || name, password }))
    .catch((error) => {
      console.error('Error sending DIY welcome email:', error);
    });

  return { user, created: true, emailSent: true };
}

module.exports = {
  createDiyClientFromProfessional,
  sendDiyWelcomeEmail,
};
