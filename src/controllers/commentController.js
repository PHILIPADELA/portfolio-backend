const Comment = require('../models/Comment');

exports.getComments = async (req, res) => {
  try {
    const blogPostId = req.params.blogPostId;
    const comments = await Comment.find({ blogPostId })
      .sort({ createdAt: -1 })
      .lean();
    
    res.status(200).json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Error fetching comments', error: error.message });
  }
};

exports.createComment = async (req, res) => {
  try {
    const { blogPostId } = req.params;
    const { author, content, replyTo } = req.body;

    if (!author || !content) {
      return res.status(400).json({ message: 'Author and content are required' });
    }

    let parentAuthor = null;
    
    // If this is a reply, verify the parent comment exists and get its author
    if (replyTo) {
      const parentComment = await Comment.findOne({
        _id: replyTo,
        blogPostId
      });

      if (!parentComment) {
        return res.status(404).json({
          message: 'Parent comment not found or does not belong to this blog post'
        });
      }

      parentAuthor = parentComment.author;
    }

    const comment = new Comment({
      blogPostId,
      author,
      content,
      replyTo,
      parentAuthor // Save the parent author's name
    });
    
    await comment.save();
    const commentResponse = comment.toObject();
    
    if (!commentResponse.deleteKey) {
      console.error('DeleteKey not generated for comment:', commentResponse);
      return res.status(500).json({ message: 'Error creating comment: No delete key generated' });
    }
    
    console.log(replyTo ? 'Created reply with deleteKey:' : 'Created comment with deleteKey:', commentResponse.deleteKey);
    res.status(201).json(commentResponse);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Error creating comment', error: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { blogPostId, commentId } = req.params;
    const { deleteKey } = req.query;
    
    const comment = await Comment.findOne({ 
      _id: commentId,
      blogPostId
    });
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found or does not belong to this blog post' });
    }

    if (!deleteKey || comment.deleteKey !== deleteKey) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }
    
    // Also delete any replies to this comment
    await Comment.deleteMany({ replyTo: commentId });
    // Delete the comment itself
    await Comment.findByIdAndDelete(commentId);
    
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Error deleting comment', error: error.message });
  }
};

exports.getReplies = async (req, res) => {
  try {
    const { blogPostId, commentId } = req.params;
    const replies = await Comment.find({ 
      blogPostId,
      replyTo: commentId 
    })
      .sort({ createdAt: -1 })
      .lean();
    
    res.status(200).json(replies);
  } catch (error) {
    console.error('Error fetching replies:', error);
    res.status(500).json({ message: 'Error fetching replies', error: error.message });
  }
};

exports.createReply = async (req, res) => {
  try {
    const { blogPostId, commentId } = req.params;
    const { author, content } = req.body;

    if (!author || !content) {
      return res.status(400).json({ message: 'Author and content are required' });
    }

    // Find the parent comment and verify it belongs to the blog post
    const parentComment = await Comment.findOne({
      _id: commentId,
      blogPostId
    });
    if (!parentComment) {
      return res.status(404).json({ message: 'Parent comment not found or does not belong to this blog post' });
    }

    const reply = new Comment({
      blogPostId: parentComment.blogPostId,
      author,
      content,
      replyTo: commentId,
      parentAuthor: parentComment.author
    });

    await reply.save();
    const replyResponse = reply.toObject();

    if (!replyResponse.deleteKey) {
      console.error('DeleteKey not generated for reply:', replyResponse);
      return res.status(500).json({ message: 'Error creating reply: No delete key generated' });
    }

    res.status(201).json(replyResponse);
  } catch (error) {
    console.error('Error creating reply:', error);
    res.status(500).json({ message: 'Error creating reply', error: error.message });
  }
};

exports.deleteReply = async (req, res) => {
  try {
    const { blogPostId, commentId, replyId } = req.params;
    const { deleteKey } = req.query;

    const reply = await Comment.findOne({
      _id: replyId,
      blogPostId: blogPostId,
      replyTo: commentId
    });
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found or does not belong to this blog post and comment' });
    }

    if (!reply.replyTo) {
      return res.status(400).json({ message: 'This comment is not a reply' });
    }

    if (!deleteKey || reply.deleteKey !== deleteKey) {
      return res.status(403).json({ message: 'Not authorized to delete this reply' });
    }

    await Comment.findByIdAndDelete(replyId);
    res.status(200).json({ message: 'Reply deleted successfully' });
  } catch (error) {
    console.error('Error deleting reply:', error);
    res.status(500).json({ message: 'Error deleting reply', error: error.message });
  }
};