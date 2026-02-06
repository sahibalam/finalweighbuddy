const nodemailer = require('nodemailer');
const User = require('../models/User');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `WeighBuddy <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Welcome to WeighBuddy DIY – Your Login Details',
    html,
  });
}

async function createDiyClientFromProfessional({ firstName, lastName, email, phone, password }) {
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
  });

  await user.save();

  await sendDiyWelcomeEmail({ email, firstName: firstName || name, password });

  return { user, created: true, emailSent: true };
}

module.exports = {
  createDiyClientFromProfessional,
  sendDiyWelcomeEmail,
};
