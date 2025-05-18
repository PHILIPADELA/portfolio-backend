const express = require('express');const router = express.Router();
const commentController = require('../controllers/commentController');
const cors = require('cors');

router.use(cors());

// Get all comments for a blog post
router.get('/:blogPostId/comments', commentController.getComments);

// Create a new comment
router.post('/:blogPostId/comments', commentController.createComment);

// Delete a comment (will also delete all replies)
router.delete('/:blogPostId/comments/:commentId', commentController.deleteComment);

// Get replies for a specific comment
router.get('/:blogPostId/comments/:commentId/replies', commentController.getReplies);

// Create a reply to a comment
router.post('/:blogPostId/comments/:commentId/replies', commentController.createReply);

// Delete a reply
router.delete('/:blogPostId/comments/:commentId/replies/:replyId', commentController.deleteReply);

module.exports = router;
