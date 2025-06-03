const Testimonial = require('../models/Testimonial');
const multer = require('multer');
const path = require('path');


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  }
}).single('avatar');

exports.submitTestimonial = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      const { name, position, rating, testimonial } = req.body;
      const testimonialData = {
        name,
        position,
        rating: parseInt(rating),
        testimonial,
        avatar: req.file ? `/uploads/${req.file.filename}` : undefined
      };

      const newTestimonial = new Testimonial(testimonialData);
      await newTestimonial.save();

      res.status(201).json({ message: 'Testimonial submitted successfully' });
    });
  } catch (error) {
    console.error('Testimonial submission error:', error);
    res.status(500).json({ message: 'Error submitting testimonial', error: error.message });
  }
};

exports.getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ approved: true })
      .sort({ createdAt: -1 })
      .select('-__v');
    res.json(testimonials);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({ message: 'Error fetching testimonials', error: error.message });
  }
};
