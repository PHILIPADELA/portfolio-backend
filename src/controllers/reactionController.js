const BlogPost = require('../models/BlogPost');

exports.toggleReaction = async (req, res) => {
  try {    console.log('Reaction request received:', {
      params: req.params,
      body: req.body,
      url: req.originalUrl,
      method: req.method
    });

    const { postId } = req.params;
    const { reactionType, userId } = req.body;

    if (!reactionType || !userId) {
      console.log('Missing required fields:', { reactionType, userId });
      return res.status(400).json({ message: 'Reaction type and userId are required' });
    }

    if (!['like', 'love', 'wow', 'sad'].includes(reactionType)) {
      console.log('Invalid reaction type:', reactionType);
      return res.status(400).json({ message: 'Invalid reaction type' });
    }    console.log('Looking for blog post with ID:', postId);
    const post = await BlogPost.findById(postId);
    if (!post) {
      console.log('Blog post not found with ID:', postId);
      return res.status(404).json({ message: 'Blog post not found' });
    }
    console.log('Found blog post:', post._id);

    const hasReacted = post.reactions[reactionType].includes(userId);
    console.log('Current reaction state:', {
      hasReacted,
      reactionType,
      userId,
      currentReactions: post.reactions[reactionType]
    });
    
    if (hasReacted) {
      console.log('Removing reaction');
      post.reactions[reactionType] = post.reactions[reactionType].filter(id => id !== userId);
    } else {
      console.log('Adding reaction');
      post.reactions[reactionType].push(userId);
    }

    console.log('Saving updated reactions:', post.reactions);
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
