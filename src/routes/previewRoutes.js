const express = require('express');
const router = express.Router();
const { fetchPageMeta } = require('../controllers/previewController');

router.get('/', fetchPageMeta);

module.exports = router;
