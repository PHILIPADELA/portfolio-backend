const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const config = require('../config/config');

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Create admin user
      const admin = new Admin({
        username: 'adela',
        password: 'adeLOLA1.0' // Change this to your desired password
      });
      
      await admin.save();
      console.log('Admin user created successfully');
    } catch (error) {
      console.error('Error creating admin user:', error);
    }
    
    // Close connection
    mongoose.connection.close();
  })
  .catch(error => {
    console.error('MongoDB connection error:', error);
  });
