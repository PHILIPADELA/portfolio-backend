const mongoose = require('mongoose');
const crypto = require('crypto');

const commentSchema = new mongoose.Schema({
  blogPostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogPost',
    required: true
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  deleteKey: {
    type: String,
    required: true,
    default: () => crypto.randomBytes(16).toString('hex')
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Comment', commentSchema);
