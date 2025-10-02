const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { URL } = require('url');
let Redis; // lazy require so app won't crash if lib isn't installed
let redisClient = null;

// Initialize Redis client if REDIS_URL is provided
const REDIS_URL = process.env.REDIS_URL || process.env.REDIS_URI || null;
if (REDIS_URL) {
  try {
    Redis = require('ioredis');
    redisClient = new Redis(REDIS_URL);
    // Optional: handle connection errors
    redisClient.on('error', (err) => console.warn('Redis error (preview cache):', err && err.message));
  } catch (e) {
    console.warn('ioredis not available, falling back to in-memory cache for previews');
    redisClient = null;
  }
}

// Simple in-memory cache for link previews (fallback if Redis not configured).
// Keys are the normalized URL string (lowercased); values are { value: <previewObj>, expires: <ms> }.
const cache = new Map();
const CACHE_TTL_MS = parseInt(process.env.PREVIEW_CACHE_TTL_MS, 10) || 60 * 60 * 1000; // default 1 hour
const MAX_CACHE_ENTRIES = parseInt(process.env.PREVIEW_CACHE_MAX_ENTRIES, 10) || 1000;

// Limits and sanitization
const MAX_URL_LENGTH = parseInt(process.env.PREVIEW_MAX_URL_LENGTH, 10) || 2000; // refuse urls longer than this
const MAX_CACHED_PAYLOAD_BYTES = parseInt(process.env.PREVIEW_MAX_CACHED_PAYLOAD_BYTES, 10) || 32 * 1024; // 32 KB

function setCache(key, value) {
  const expires = Date.now() + CACHE_TTL_MS;
  cache.set(key, { value, expires });
  // Simple eviction: drop oldest when exceeding max entries
  if (cache.size > MAX_CACHE_ENTRIES) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
}

function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

// Redis helpers
async function redisGet(key) {
  if (!redisClient) return null;
  try {
    const raw = await redisClient.get(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Redis get error:', e && e.message);
    return null;
  }
}

async function redisSet(key, value) {
  if (!redisClient) return;
  try {
    const raw = JSON.stringify(value);
    if (Buffer.byteLength(raw, 'utf8') > MAX_CACHED_PAYLOAD_BYTES) {
      // payload too large to cache in Redis
      return;
    }
    // Use PX for milliseconds TTL
    await redisClient.set(key, raw, 'PX', CACHE_TTL_MS);
  } catch (e) {
    console.warn('Redis set error:', e && e.message);
  }
}

async function fetchPageMeta(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url query parameter' });

  try {
    // Basic validation
    if (typeof url !== 'string' || url.length > MAX_URL_LENGTH) {
      return res.status(400).json({ error: 'URL is missing or exceeds allowed length' });
    }
    const parsed = new URL(url);
    // Only allow http(s)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: 'Invalid URL protocol' });
    }

    // support a ?refresh=true query param or X-Cache-Refresh header to bypass cache
    const refresh = req.query.refresh === '1' || req.query.refresh === 'true' || req.headers['x-cache-refresh'] === '1' || req.headers['x-cache-refresh'] === 'true';
    // cache key should be reasonably sized; if it's too long, hash it.
    let cacheKey = parsed.toString().toLowerCase();
    if (cacheKey.length > 200) {
      // use a simple hash to avoid huge keys
      const crypto = require('crypto');
      cacheKey = 'preview:' + crypto.createHash('sha256').update(cacheKey).digest('hex');
    } else {
      cacheKey = 'preview:' + cacheKey;
    }

    if (!refresh) {
      // Try Redis first when available
      if (redisClient) {
        const cached = await redisGet(cacheKey);
        if (cached) return res.json(Object.assign({}, cached, { cached: true }));
      }

      // Fallback to in-memory cache
      const cachedMem = getCache(cacheKey);
      if (cachedMem) return res.json(Object.assign({}, cachedMem, { cached: true }));
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

    const result = {
      title: ogTitle || domain,
      description: ogDescription || '',
      image: image || null,
      url,
      domain
    };

    // Cache successful responses
    try {
      // set in-memory cache always (quick local read)
      setCache(cacheKey, result);
      // set in Redis if configured
      if (redisClient) await redisSet(cacheKey, result);
    } catch (e) {
      // cache failures shouldn't break the response
      console.warn('Preview cache warning:', e && e.message);
    }

    return res.json(result);
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timed out' });
    }
    console.error('Preview error:', err.message);
    return res.status(500).json({ error: 'Error fetching preview', details: err.message });
  }
}

module.exports = { fetchPageMeta };
