const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { URL } = require('url');

async function fetchPageMeta(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url query parameter' });

  try {
    // Basic validation
    const parsed = new URL(url);
    // Only allow http(s)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: 'Invalid URL protocol' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'ADELA-LinkPreview/1.0 (+https://adelaportfolio.vercel.app)'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(502).json({ error: 'Failed to fetch url', status: response.status });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const ogTitle = $('meta[property="og:title"]').attr('content') || $('title').text();
    const ogDescription = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
    const ogImage = $('meta[property="og:image"]').attr('content') || $('meta[name="image"]').attr('content') || '';

    // Resolve relative image URLs
    let image = ogImage;
    try {
      if (image && !image.match(/^https?:\/\//)) {
        image = new URL(image, url).toString();
      }
    } catch (e) {
      image = ogImage;
    }

    const domain = parsed.hostname.replace(/^www\./, '');

    return res.json({
      title: ogTitle || domain,
      description: ogDescription || '',
      image: image || null,
      url,
      domain
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timed out' });
    }
    console.error('Preview error:', err.message);
    return res.status(500).json({ error: 'Error fetching preview', details: err.message });
  }
}

module.exports = { fetchPageMeta };
