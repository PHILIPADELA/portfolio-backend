const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const config = require('../config/config');


mongoose.connect(config.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      
      const admin = new Admin({
        username: 'adela',
        password: 'adeLOLA1.0'
      });
      
      await admin.save();
      console.log('Admin user created successfully');
    } catch (error) {
      console.error('Error creating admin user:', error);
    }
    
    
    mongoose.connection.close();
  })
  .catch(error => {
    console.error('MongoDB connection error:', error);
  });
