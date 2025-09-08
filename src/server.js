const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const config = require('./config/config');
const ensureUploadDirectories = require('./utils/ensureDirectories');
const fs = require('fs');


ensureUploadDirectories();


const contactRoutes = require('./routes/contactRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const adminRoutes = require('./routes/adminRoutes');
const blogRoutes = require('./routes/blogRoutes');
const commentRoutes = require('./routes/commentRoutes');
const reactionRoutes = require('./routes/reactionRoutes');


const app = express();
// Trust proxy for correct client IP and rate limiting
app.set('trust proxy', 1);


app.use(cors({
  origin: [
    'https://portfolio-frontend-wheat-ten.vercel.app',
    'http://localhost:2000',
    'https://adelaportfolio.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));


// Use Helmet with a relaxed Content Security Policy for SEO endpoint images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
      connectSrc: ["'self'", 'https://res.cloudinary.com'],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  }
}));

app.options('*', cors());


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api/blog', (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    if (req.headers['content-type']?.startsWith('multipart/form-data')) {
      return next();
    }
  }
  express.json()(req, res, next);
});


const limiter = rateLimit({
  windowMs: 3 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/uploads', (req, res, next) => {
  const filePath = path.join(__dirname, '../uploads', req.url);
  console.log('Static file request received:', {
    url: req.url,
    fullPath: filePath,
    exists: fs.existsSync(filePath)
  });


  const uploadsDir = path.join(__dirname, '../uploads/blog');
  if (!fs.existsSync(uploadsDir)) {
    console.log('Creating uploads directory:', uploadsDir);
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');

  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    return res.status(404).json({
      error: 'File not found',
      requestedPath: req.url,
      fullPath: filePath
    });
  }

  next();
}, express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, filePath) => {

    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    
    console.log('Serving file:', filePath, 'with content-type:', contentType);
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=31557600'); 
  }
}));

app.get('/debug/images', (req, res) => {
  const uploadsPath = path.join(__dirname, '../uploads/blog');
  fs.readdir(uploadsPath, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error reading uploads directory', details: err.message });
    }
    res.json({
      uploadsPath,
      files,
      fullUrls: files.map(file => `${req.protocol}://${req.get('host')}/uploads/blog/${file}`)
    });
  });
});


app.use('/api/contact', contactRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', commentRoutes);  
app.use('/api/blog', blogRoutes);
app.use('/api/reactions', express.json(), reactionRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!', error: err.message });
});


mongoose.connect(config.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(config.PORT, () => {
      console.log(`Server is running on port ${config.PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });


process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close(false)
    .then(() => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error during shutdown:', err);
      process.exit(1);
    });
});
