const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const cors = require('cors');


router.use(cors());


router.get('/blog/:blogPostId/comments', commentController.getComments);


router.post('/blog/:blogPostId/comments', commentController.createComment);


router.delete('/blog/:blogPostId/comments/:commentId', commentController.deleteComment);

module.exports = router;
