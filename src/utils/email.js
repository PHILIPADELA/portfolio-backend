const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const config = require('../config/config');

const createTransporter = async () => {
 
  const oauth2Client = new google.auth.OAuth2(
    config.GMAIL_CLIENT_ID,
    config.GMAIL_CLIENT_SECRET,
    config.GMAIL_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: config.GMAIL_REFRESH_TOKEN
  });

  try {
    
    const accessToken = await oauth2Client.getAccessToken();

   
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: config.EMAIL_USER,
        clientId: config.GMAIL_CLIENT_ID,
        clientSecret: config.GMAIL_CLIENT_SECRET,
        refreshToken: config.GMAIL_REFRESH_TOKEN,
        accessToken: accessToken.token
      },
      debug: true,
      logger: true
    });

    
    transporter.verify(function(error, success) {
      if (error) {
        console.error('SMTP connection error:', error);
      } else {
        console.log('Server is ready to take our messages');
      }
    });

    return transporter;
  } catch (error) {
    console.error('Error creating transporter:', error);
    throw error;
  }
};

const sendMail = async (options) => {
  try {
    const transporter = await createTransporter();
    const mailOptions = {
      from: `"Portfolio Contact" <${config.EMAIL_USER}>`,
      ...options,
      connectionTimeout: 10000,
      socketTimeout: 20000
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error details:', error);
    throw error;
  }
};

module.exports = {
  sendMail
};
