const BlogPost = require('../models/BlogPost');
const path = require('path');
const fs = require('fs').promises;
const cloudinary = require('../utils/cloudinary');
const probe = require('probe-image-size');
const https = require('https');
const config = require('../config/config');


exports.getAllPosts = async (req, res) => {
  try {
    // Pagination params
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(12, parseInt(req.query.limit, 10) || 6); // default 6, cap 50

    // Build query filters
    const query = {};
    if (req.query.search) {
      const q = req.query.search;
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { excerpt: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
      ];
    }
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Sorting
    let sort = { createdAt: -1 };
    if (req.query.sortBy === 'title') {
      sort = { title: 1 };
    }
    // If search is provided, attempt regex matches first and fall back to fuzzy Levenshtein matching
    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Levenshtein distance (iterative DP)
    const levenshtein = (a = '', b = '') => {
      a = String(a);
      b = String(b);
      const al = a.length;
      const bl = b.length;
      if (al === 0) return bl;
      if (bl === 0) return al;
      const v0 = new Array(bl + 1).fill(0).map((_, i) => i);
      const v1 = new Array(bl + 1).fill(0);
      for (let i = 0; i < al; i++) {
        v1[0] = i + 1;
        for (let j = 0; j < bl; j++) {
          const cost = a[i].toLowerCase() === b[j].toLowerCase() ? 0 : 1;
          v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
        }
        for (let k = 0; k <= bl; k++) v0[k] = v1[k];
      }
      return v1[bl];
    };

    if (req.query.search) {
      const q = String(req.query.search || '').trim();
      const regex = new RegExp(escapeRegex(q), 'i');

      // Fetch candidates that match category (if provided) and sort order
      const candidates = await BlogPost.find(query).sort(sort).lean();

      // Exact/substring matches first
      let matched = candidates.filter(p => (
        (p.title && regex.test(p.title)) ||
        (p.excerpt && regex.test(p.excerpt)) ||
        (p.content && regex.test(p.content))
      ));

      // If none or very few matches, do fuzzy matching using Levenshtein on title/excerpt
      if (!matched.length) {
        // Tuned threshold: allow slightly more tolerance (40% of query length)
        const threshold = Math.max(1, Math.floor(q.length * 0.4));
        matched = candidates.filter(p => {
          const title = p.title || '';
          const excerpt = p.excerpt || '';
          const dt = levenshtein(q, title);
          const de = levenshtein(q, excerpt);
          return dt <= threshold || de <= threshold;
        });
      }

      const total = matched.length;
      const start = (page - 1) * limit;
      const end = start + limit;
      const paged = matched.slice(start, end);

      console.log(`GET /api/blog search='${q}' page=${page} limit=${limit} returned=${paged.length} total=${total}`);

      res.set('X-Total-Count', String(total));
      res.set('X-Page', String(page));
      res.set('X-Limit', String(limit));
      res.set('Access-Control-Expose-Headers', 'X-Total-Count, X-Page, X-Limit');

      return res.json({ posts: paged, total, page, limit });
    }

    // No search - use efficient DB pagination
    const total = await BlogPost.countDocuments(query);
    const posts = await BlogPost.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    console.log(`GET /api/blog page=${page} limit=${limit} returned=${posts.length} total=${total}`);

    res.set('X-Total-Count', String(total));
    res.set('X-Page', String(page));
    res.set('X-Limit', String(limit));
    res.set('Access-Control-Expose-Headers', 'X-Total-Count, X-Page, X-Limit');

    res.json({ posts, total, page, limit });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ message: 'Error fetching blog posts', error: error.message });
  }
};

exports.getPost = async (req, res) => {
  try {
    console.log('Getting post with ID:', req.params.id);
    const post = await BlogPost.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
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

// Lightweight server-side SEO page for crawlers
exports.renderSeo = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id).lean();
    if (!post) {
      return res.status(404).send('Blog post not found');
    }

    // build absolute image URL
    const host = `${req.protocol}://${req.get('host')}`;
    let imageUrl = post.image || '/uploads/blog/default.jpg';
    if (!imageUrl.startsWith('http')) {
      imageUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
      imageUrl = `${host}${imageUrl}`;
    }

    // best-effort: probe remote image for width/height/type
    let imgMeta = {};
    try {
      const result = await probe(imageUrl);
      if (result) {
        imgMeta.width = result.width;
        imgMeta.height = result.height;
        imgMeta.type = result.type; // e.g., 'jpeg', 'png', 'webp'
      }
    } catch (err) {
      // ignore probe failures; proceed without width/height/type
      console.warn('Image probe failed for', imageUrl, err && err.message);
    }

    const canonicalUrl = `${host}/blog/${post._id}`;
    const title = `${post.title || 'Blog Post'} - ADELA's Blog`;
    const description = post.excerpt || '';

    const escapeHtml = (str = '') => String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="article" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  ${imgMeta.width ? `<meta property="og:image:width" content="${String(imgMeta.width)}" />` : ''}
  ${imgMeta.height ? `<meta property="og:image:height" content="${String(imgMeta.height)}" />` : ''}
  ${imgMeta.type ? `<meta property="og:image:type" content="image/${escapeHtml(imgMeta.type)}" />` : ''}
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
      headline: post.title,
      description: post.excerpt,
      image: imageUrl,
      author: { '@type': 'Person', name: post.author || 'ADELA' },
      datePublished: post.createdAt,
      dateModified: post.updatedAt || post.createdAt,
      publisher: { '@type': 'Organization', name: "ADELA's Blog" }
    })}</script>
</head>
<body>
  <h1>${escapeHtml(post.title || 'Blog Post')}</h1>
  <p>${escapeHtml(post.excerpt || '')}</p>
  <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(post.title || '')}" style="max-width:100%;height:auto" />
</body>
</html>`;

    res.set('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (error) {
    console.error('Error rendering SEO page:', error);
    return res.status(500).send('Error rendering SEO page');
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

    // Upload image to Cloudinary
    let imageUrl = '';
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'blog'
      });
      imageUrl = result.secure_url;
      // Remove local file after upload
      await fs.unlink(req.file.path);
    } catch (err) {
      return res.status(500).json({ message: 'Cloudinary upload failed', error: err.message });
    }

    const {
      title,
      excerpt,
      content,
      category,
      tags,
      author,
      readTime
    } = req.body;
    const blogPost = new BlogPost({
      title,
      excerpt,
      content,
      image: imageUrl,
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
    // Fire-and-forget: Ping Google with sitemap URL to notify of content change
    try {
      const sitemapUrl = `${config.CLIENT_URL.replace(/\/$/, '')}/sitemap.xml`;
      const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
      https.get(pingUrl, (resPing) => {
        const { statusCode } = resPing;
        console.log(`Google ping sent for sitemap ${sitemapUrl}, statusCode=${statusCode}`);
        // consume response to free socket
        resPing.on('data', () => {});
        resPing.on('end', () => {});
      }).on('error', (err) => {
        console.warn('Error pinging Google sitemap:', err && err.message);
      });
    } catch (err) {
      console.warn('Failed to initiate Google ping:', err && err.message);
    }

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
      // Upload new image to Cloudinary
      let imageUrl = '';
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'blog'
        });
        imageUrl = result.secure_url;
        await fs.unlink(req.file.path);
      } catch (err) {
        console.error('Cloudinary upload failed:', err);
        return res.status(500).json({ message: 'Cloudinary upload failed', error: err.message });
      }
      // Optionally, you can delete the old image from Cloudinary if you store its public_id
      updateData.image = imageUrl;
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

    // Fire-and-forget: Ping Google with sitemap URL to notify of content change on update
    try {
      const sitemapUrl = `${config.CLIENT_URL.replace(/\/$/, '')}/sitemap.xml`;
      const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
      https.get(pingUrl, (resPing) => {
        const { statusCode } = resPing;
        console.log(`Google ping sent for sitemap ${sitemapUrl}, statusCode=${statusCode}`);
        resPing.on('data', () => {});
        resPing.on('end', () => {});
      }).on('error', (err) => {
        console.warn('Error pinging Google sitemap on update:', err && err.message);
      });
    } catch (err) {
      console.warn('Failed to initiate Google ping on update:', err && err.message);
    }

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


