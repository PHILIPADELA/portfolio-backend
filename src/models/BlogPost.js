const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  excerpt: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  author: {
    type: String,
    required: true,
    trim: true
  },
  readTime: {
    type: String,
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  reactions: {
    like: [{
      type: String, 
      required: true
    }],
    love: [{
      type: String,
      required: true
    }],
    wow: [{
      type: String,
      required: true
    }],
    sad: [{
      type: String,
      required: true
    }],
    sad: [{
      type: String,
      required: true
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});


blogPostSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('BlogPost', blogPostSchema);
