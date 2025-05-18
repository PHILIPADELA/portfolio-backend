const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const auth = require('../middleware/auth');


router.get('/comments/blog/:blogPostId', commentController.getComments);

router.post('/comments/blog/:blogPostId', commentController.createComment);

router.delete('/comments/:commentId', auth, commentController.deleteComment);

module.exports = router;
