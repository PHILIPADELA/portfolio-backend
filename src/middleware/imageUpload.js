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
      console.error('Error with upload directory:', {
        path: uploadPath,
        error: err.message,
        code: err.code
      });
      cb(err);
    }
  },
  filename: (req, file, cb) => {
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
  console.log('Starting image upload...');
  console.log('Request headers:', req.headers);
  
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res.status(400).json({
        message: 'File upload error',
        error: err.message
      });
    } else if (err) {
      console.error('Non-Multer error during upload:', err);
      return res.status(400).json({
        message: 'Image upload failed',
        error: err.message
      });
    }

    if (req.method === 'PUT' && !req.file) {
      // For updates (PUT), allow no image to be provided
      console.log('No new image provided for update');
      next();
    } else if (req.method === 'POST' && !req.file) {
      // For new posts (POST), require an image
      console.log('No image file provided for new post');
      return res.status(400).json({
        message: 'Please provide an image file'
      });
    } else {
      // Log successful upload
      console.log('Image uploaded successfully:', {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
      next();
    }
  });
};

module.exports = {
  handleImageUpload
};
