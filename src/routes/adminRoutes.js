const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');


router.post('/login', adminController.login);
const adminController = require('../controllers/adminController');

// ...existing admin routes...

// TEMPORARY: Route to create an admin user
router.post('/create', adminController.createAdmin);

router.get('/testimonials', auth, adminController.getTestimonialsForApproval);
router.put('/testimonials/:id/approve', auth, adminController.approveTestimonial);
router.delete('/testimonials/:id', auth, adminController.deleteTestimonial);
router.get('/contacts', auth, adminController.getContacts);

module.exports = router;
