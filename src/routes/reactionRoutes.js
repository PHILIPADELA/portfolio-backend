const express = require('express');
const router = express.Router();
const reactionController = require('../controllers/reactionController');

router.post('/:Id', reactionController.toggleReaction);

module.exports = router;
