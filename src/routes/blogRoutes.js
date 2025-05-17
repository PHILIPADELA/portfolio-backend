const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const blogController = require('../controllers/blogController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { handleImageUpload } = require('../middleware/imageUpload');

// Validation rules for blog posts
const blogValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('excerpt').trim().notEmpty().withMessage('Excerpt is required'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('author').trim().notEmpty().withMessage('Author is required'),
  body('readTime').trim().notEmpty().withMessage('Read time is required')
];

// Public routes
router.get('/', blogController.getAllPosts);
router.get('/:id', blogController.getPost);

// Protected routes - require authentication
router.post('/', auth, handleImageUpload, blogController.createPost);
router.put('/:id', auth, handleImageUpload, blogController.updatePost);
router.delete('/:id', auth, blogController.deletePost);

module.exports = router;
