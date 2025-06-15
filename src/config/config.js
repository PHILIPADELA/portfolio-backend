require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://ADELAA:adeLOLA1.9@cluster0.hsbkpfo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
  JWT_SECRET: process.env.JWT_SECRET || 'rTTlluVwRcTkIkHx5cX+GNTJf85bJrZ/bFG7Q57LArQ',
  NODE_ENV: process.env.NODE_ENV || 'production',
  CLIENT_URL: process.env.CLIENT_URL || 'https://portfolio-frontend-wheat-ten.vercel.app',
  
  
  EMAIL_HOST: 'smtp.gmail.com',
  EMAIL_PORT: 587,
  EMAIL_USER: process.env.EMAIL_USER || 'adeyekunadelola0@gmail.com',
  
  
  
  GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID || '149049357105-r7lfc3ffql678h2od860jmsba9au0ltv.apps.googleusercontent.com',
  GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET || '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',
  GMAIL_REDIRECT_URI: process.env.GMAIL_REDIRECT_URI || 'https://developers.google.com/oauthplayground',
  GMAIL_REFRESH_TOKEN: process.env.GMAIL_REFRESH_TOKEN
};
