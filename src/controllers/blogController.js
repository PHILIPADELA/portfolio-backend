const BlogPost = require('../models/BlogPost');
const path = require('path');
const fs = require('fs').promises;


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

exports.createPost = async (req, res) => {
  try {
    console.log('Create post request body:', req.body);
    console.log('Create post request file:', req.file);

   
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
    } = req.body;    const blogPost = new BlogPost({
      title,
      excerpt,
      content,
      image: `/uploads/blog/${req.file.filename}`,
      category,
      tags: tags ? JSON.parse(tags) : [],
      author,
      readTime,
      reactions: {
        like: [],
        love: [],
        wow: [],
        sad: []
      }
    });

    await blogPost.save();
    res.status(201).json(blogPost);
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ message: 'Error creating blog post', error: error.message });
  }
};


exports.updatePost = async (req, res) => {  try {
    console.log('Update request received:', {
      body: req.body,
      file: req.file,
      params: req.params
    });

    const postId = req.params.id;
    
   
    const existingPost = await BlogPost.findById(postId);
    if (!existingPost) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    const updateData = { ...req.body };
    
   
    if (req.file) {
      
      if (existingPost.image) {
        const oldImagePath = path.join(__dirname, '../../', existingPost.image);
        try {
          await fs.promises.unlink(oldImagePath);
          console.log(`Deleted old image: ${oldImagePath}`);
        } catch (err) {
          console.error('Error deleting old image:', err);
          
        }
      }
      updateData.image = `/uploads/blog/${req.file.filename}`;
    }

    
    try {
      if (updateData.tags) {
        
        updateData.tags = typeof updateData.tags === 'string' 
          ? JSON.parse(updateData.tags)
          : updateData.tags;
      }
    } catch (error) {
      console.error('Error parsing tags:', error);
      updateData.tags = [];
    }

    console.log('Updating post with data:', updateData);

    const updatedPost = await BlogPost.findByIdAndUpdate(
      postId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ message: 'Error updating blog post', error: error.message });
  }
};


exports.deletePost = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    
    if (post.image) {
      const imagePath = path.join(__dirname, '../../', post.image);
      try {
        await fs.promises.unlink(imagePath);
        console.log(`Deleted image file: ${imagePath}`);
      } catch (err) {
        console.error('Error deleting image file:', err);
        
      }
    }

    await BlogPost.findByIdAndDelete(req.params.id);
    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ message: 'Error deleting blog post', error: error.message });
  }
};

exports.toggleReaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { reactionType, userId } = req.body;

    if (!['like', 'love', 'wow', 'sad'].includes(reactionType)) {
      return res.status(400).json({ message: 'Invalid reaction type' });
    }

    const post = await BlogPost.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

   
    if (!post.reactions) {
      post.reactions = {
        like: [],
        love: [],
        wow: [],
        sad: []
      };
    }

   
    const reactionArray = post.reactions[reactionType];
    const userIndex = reactionArray.indexOf(userId);

    if (userIndex === -1) {
     
      reactionArray.push(userId);
      
     
      Object.keys(post.reactions).forEach(type => {
        if (type !== reactionType) {
          const index = post.reactions[type].indexOf(userId);
          if (index !== -1) {
            post.reactions[type].splice(index, 1);
          }
        }
      });
    } else {
      
      reactionArray.splice(userIndex, 1);
    }

    const updatedPost = await post.save();
    res.json({
      message: 'Reaction updated successfully',
      reactions: updatedPost.reactions
    });
  } catch (error) {
    console.error('Error updating reaction:', error);
    res.status(500).json({ message: 'Error updating reaction', error: error.message });
  }
};
