const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const testimonialController = require('../controllers/testimonialController');
const validate = require('../middleware/validate');


const testimonialValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('position').trim().notEmpty().withMessage('Position is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('testimonial').trim().notEmpty().withMessage('Testimonial is required')
];

router.post('/', testimonialValidation, validate, testimonialController.submitTestimonial);
router.get('/', testimonialController.getTestimonials);

module.exports = router;
