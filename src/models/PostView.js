const mongoose = require('mongoose');

const postViewModel = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogPost',
    required: true
  },
  visitorId: {
    type: String,
    required: true
  },
  lastViewed: {
    type: Date,
    default: Date.now
  }
});


postViewModel.index({ postId: 1, visitorId: 1 }, { unique: true });

module.exports = mongoose.model('PostView', postViewModel);
