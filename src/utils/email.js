const nodemailer = require('nodemailer');
const config = require('../config/config');


const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_APP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});


transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('Server is ready to take our messages');
  }
});

const sendMail = async (options) => {
  try {
    const mailOptions = {
      from: `"Portfolio Contact" <${config.EMAIL_USER}>`,
      ...options,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

module.exports = {
  sendMail
};
