const mongoose = require('mongoose');

const postViewSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogPost',
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });


postViewSchema.index({ postId: 1, ipAddress: 1, sessionId: 1 }, { unique: true });

const PostView = mongoose.model('PostView', postViewSchema);

module.exports = PostView;