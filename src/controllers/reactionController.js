const BlogPost = require('../models/BlogPost');

exports.toggleReaction = async (req, res) => {
  try {
    const { postId } = req.params;
    const { reactionType, userId } = req.body;

    if (!reactionType || !userId) {
      return res.status(400).json({ message: 'Reaction type and userId are required' });
    }

    if (!['like', 'love', 'wow', 'sad'].includes(reactionType)) {
      return res.status(400).json({ message: 'Invalid reaction type' });
    }

    const post = await BlogPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    const hasReacted = post.reactions[reactionType].includes(userId);
    
    if (hasReacted) {
      
      post.reactions[reactionType] = post.reactions[reactionType].filter(id => id !== userId);
    } else {
   
      post.reactions[reactionType].push(userId);
    }

    await post.save();

    res.json({
      message: hasReacted ? 'Reaction removed' : 'Reaction added',
      reactions: post.reactions
    });
  } catch (error) {
    console.error('Error handling reaction:', error);
    res.status(500).json({ message: 'Error handling reaction', error: error.message });
  }
};
