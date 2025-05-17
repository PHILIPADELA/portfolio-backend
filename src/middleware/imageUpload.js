const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/blog');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      console.log('Upload directory ensured:', uploadPath);
      cb(null, uploadPath);
    } catch (err) {
      console.error('Error creating upload directory:', err);
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    // Create a URL-friendly filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname).toLowerCase();
    const filename = `blog-${uniqueSuffix}${extension}`;
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  console.log('File upload attempt:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    isValid: extname && mimetype
  });

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
  }
};

// Configure multer
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

// Middleware to handle image upload
const handleImageUpload = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Image upload error:', err);
      return res.status(400).json({ 
        message: 'Image upload failed', 
        error: err.message 
      });
    }
    
    if (!req.file) {
      console.log('No image file provided');
      return res.status(400).json({ 
        message: 'Please provide an image file' 
      });
    }

    // Log successful upload
    console.log('Image uploaded successfully:', {
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    next();
  });
};

// Utility function to delete image file
const deleteImage = async (imagePath) => {
  if (!imagePath) return;
  
  const fullPath = path.join(__dirname, '../../', imagePath);
  try {
    await fs.unlink(fullPath);
    console.log('Successfully deleted image:', fullPath);
  } catch (err) {
    console.error('Error deleting image:', fullPath, err);
    // Don't throw error, just log it
  }
};

module.exports = {
  handleImageUpload,
  deleteImage
};
