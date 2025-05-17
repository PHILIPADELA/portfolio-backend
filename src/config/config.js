require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://ADELAA:adeLOLA1.9@cluster0.hsbkpfo.mongodb.net/portfolio?retryWrites=true&w=majority&appName=Cluster0',
  JWT_SECRET: process.env.JWT_SECRET || 'rTTlluVwRcTkIkHx5cX+GNTJf85bJrZ/bFG7Q57LArQ',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'https://portfolio-frontend-wheat-ten.vercel.app'
};
