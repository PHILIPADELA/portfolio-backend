const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');

// Authentication routes
router.post('/login', adminController.login);

// Protected routes
router.get('/testimonials', auth, adminController.getTestimonialsForApproval);
router.put('/testimonials/:id/approve', auth, adminController.approveTestimonial);
router.delete('/testimonials/:id', auth, adminController.deleteTestimonial);
router.get('/contacts', auth, adminController.getContacts);

module.exports = router;
