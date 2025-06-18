const Comment = require('../models/Comment');

exports.getComments = async (req, res) => {
  try {
    const blogPostId = req.params.blogPostId;
    const comments = await Comment.find({ blogPostId })
      .sort({ createdAt: 1 }) // oldest first for threading
      .lean();

    // Build a map of comments by _id
    const commentMap = {};
    comments.forEach(comment => {
      comment.replies = [];
      comment._id = comment._id.toString();
      if (comment.replyTo) comment.replyTo = comment.replyTo.toString();
      commentMap[comment._id] = comment;
    });

    // Build the tree
    const roots = [];
    comments.forEach(comment => {
      if (comment.replyTo && commentMap[comment.replyTo]) {
        commentMap[comment.replyTo].replies.push(comment);
      } else {
        roots.push(comment);
      }
    });

    res.status(200).json(roots);
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
      parentAuthor
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
    const { commentId } = req.params;
    const { deleteKey } = req.query;
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (!deleteKey || comment.deleteKey !== deleteKey) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }
    
   
    await Comment.deleteMany({ replyTo: commentId });
   
    await Comment.findByIdAndDelete(commentId);
    
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Error deleting comment', error: error.message });
  }
};