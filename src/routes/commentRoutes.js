const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const auth = require('../middleware/auth');


// Get all comments for a blog post
router.get('/blog/:blogPostId/comments', commentController.getComments);

// Create a new comment
router.post('/blog/:blogPostId/comments', commentController.createComment);

// Delete a comment (using deleteKey for authorization)
router.delete('/comments/:commentId', commentController.deleteComment);

module.exports = router;
