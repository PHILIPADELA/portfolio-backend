const Comment = require('../models/Comment');

exports.getComments = async (req, res) => {
  try {
    const blogPostId = req.params.blogPostId;
    const comments = await Comment.find({ blogPostId })
      .populate({
        path: 'replyTo',
        select: 'author _id', // Only get the author and _id of the parent comment
      })
      .sort({ createdAt: -1 })
      .lean();
      
    // Add a parentAuthor field to make it easier for the frontend
    comments.forEach(comment => {
      if (comment.replyTo) {
        comment.parentAuthor = comment.replyTo.author;
        // Clean up the populated data to avoid sending unnecessary info
        delete comment.replyTo;
      }
    });

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
    }    // If this is a reply, verify the parent comment exists
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
    }    const comment = new Comment({
      blogPostId,
      author,
      content,
      replyTo
    });
    
    await comment.save();

    // If this is a reply, populate the parent comment info
    if (replyTo) {
      const populatedComment = await Comment.findById(comment._id)
        .populate({
          path: 'replyTo',
          select: 'author _id'
        });
      
      const commentResponse = populatedComment.toObject();
      commentResponse.parentAuthor = commentResponse.replyTo.author;
      delete commentResponse.replyTo;

      if (!commentResponse.deleteKey) {
        console.error('DeleteKey not generated for comment:', commentResponse);
        return res.status(500).json({ message: 'Error creating comment: No delete key generated' });
      }
      
      console.log('Created reply with deleteKey:', commentResponse.deleteKey);
      res.status(201).json(commentResponse);
    } else {
      const commentResponse = comment.toObject();
      if (!commentResponse.deleteKey) {
        console.error('DeleteKey not generated for comment:', commentResponse);
        return res.status(500).json({ message: 'Error creating comment: No delete key generated' });
      }
      console.log('Created comment with deleteKey:', commentResponse.deleteKey);
      res.status(201).json(commentResponse);
    }  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Error creating comment', error: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { deleteKey } = req.query;
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (!deleteKey || comment.deleteKey !== deleteKey) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }
    
    await Comment.findByIdAndDelete(commentId);
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Error deleting comment', error: error.message });
  }
};
