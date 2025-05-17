const nodemailer = require('nodemailer');
const config = require('../config/config');

const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: config.EMAIL_HOST,
    port: parseInt(config.EMAIL_PORT),
    secure: false,
    auth: {
      user: config.EMAIL_USER,
      pass: config.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: true,
      ciphers:'SSLv3',
      minVersion: 'TLSv1.2'
    },
    // Debug options
    debug: true,
    logger: true
  });

  // Verify SMTP connection configuration
  transporter.verify(function(error, success) {
    if (error) {
      console.error('SMTP connection error:', error);
    } else {
      console.log('Server is ready to take our messages');
    }
  });

  return transporter;
};

const sendMail = async (options) => {
  const transporter = createTransporter();
  try {
    const mailOptions = {
      from: `"Portfolio Contact" <${config.EMAIL_USER}>`,
      ...options,
      // Set a connection timeout of 10 seconds
      connectionTimeout: 10000,
      // Set a socket timeout of 20 seconds
      socketTimeout: 20000
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack
    });
    return false;
  }
};

module.exports = {
  sendMail
};
