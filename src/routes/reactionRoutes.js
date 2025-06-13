const express = require('express');
const router = express.Router();
const reactionController = require('../controllers/reactionController');

router.post('/:postId', reactionController.toggleReaction);

module.exports = router;
