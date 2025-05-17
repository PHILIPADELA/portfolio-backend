const BlogPost = require('../models/BlogPost');
const multer = require('multer');
const path = require('path');

// Configure multer for blog post image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/blog/');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'blog-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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
}).single('image');

// Get all blog posts
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await BlogPost.find()
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ message: 'Error fetching blog posts', error: error.message });
  }
};

// Get a single blog post by ID
exports.getPost = async (req, res) => {
  try {
    console.log('Getting post with ID:', req.params.id);
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      console.log('Post not found');
      return res.status(404).json({ message: 'Blog post not found' });
    }
    console.log('Found post:', post);
    res.json(post);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ message: 'Error fetching blog post', error: error.message });
  }
};

// Create a new blog post
exports.createPost = async (req, res) => {
  try {
    // Handle file upload first
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      // Validate required fields
      const requiredFields = ['title', 'excerpt', 'content', 'category', 'author', 'readTime'];
      const missingFields = requiredFields.filter(field => !req.body[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          message: `Missing required fields: ${missingFields.join(', ')}` 
        });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'Image is required' });
      }

      const {
        title,
        excerpt,
        content,
        category,
        tags,
        author,
        readTime
      } = req.body;if (!req.file) {
        return res.status(400).json({ message: 'Image is required' });
      }

      const blogPost = new BlogPost({
        title,
        excerpt,
        content,
        image: `/uploads/blog/${req.file.filename}`,
        category,
        tags: tags ? JSON.parse(tags) : [],
        author,
        readTime
      });

      await blogPost.save();
      res.status(201).json(blogPost);
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ message: 'Error creating blog post', error: error.message });
  }
};

// Update a blog post
exports.updatePost = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      const postId = req.params.id;
      
      // Find the existing post first
      const existingPost = await BlogPost.findById(postId);
      if (!existingPost) {
        return res.status(404).json({ message: 'Blog post not found' });
      }

      const updateData = { ...req.body };
      
      // Handle image update
      if (req.file) {
        // Delete old image if it exists
        if (existingPost.image) {
          const oldImagePath = path.join(__dirname, '../../', existingPost.image);
          try {
            await fs.promises.unlink(oldImagePath);
            console.log(`Deleted old image: ${oldImagePath}`);
          } catch (err) {
            console.error('Error deleting old image:', err);
            // Continue with update even if old image deletion fails
          }
        }
        updateData.image = `/uploads/blog/${req.file.filename}`;
      }
      
      if (updateData.tags) {
        updateData.tags = JSON.parse(updateData.tags);
      }

      const updatedPost = await BlogPost.findByIdAndUpdate(
        postId,
        updateData,
        { new: true }
      );

      res.json(updatedPost);
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ message: 'Error updating blog post', error: error.message });
  }
};

// Delete a blog post
exports.deletePost = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    // Delete the image file if it exists
    if (post.image) {
      const imagePath = path.join(__dirname, '../../', post.image);
      try {
        await fs.promises.unlink(imagePath);
        console.log(`Deleted image file: ${imagePath}`);
      } catch (err) {
        console.error('Error deleting image file:', err);
        // Continue with post deletion even if image deletion fails
      }
    }

    await BlogPost.findByIdAndDelete(req.params.id);
    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ message: 'Error deleting blog post', error: error.message });
  }
};
