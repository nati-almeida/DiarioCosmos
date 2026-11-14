require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();
const NASA_API_KEY = process.env.NASA_API_KEY;
const NASA_APOD_URL = 'https://api.nasa.gov/planetary/apod';
const NASA_WP_APOD_URL = 'https://science.nasa.gov/wp-json/wp/v2/apod-basic';
const PORT = process.env.PORT || 3000;

if (!NASA_API_KEY) {
  console.error('NASA_API_KEY must be configured in the server environment.');
  process.exit(1);
}

function decodeHtmlEntities(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/^Explanation:\s*/i, '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchFromNasaWordpress(date) {
  try {
    let url = NASA_WP_APOD_URL;
    if (date) {
      const yymmdd = date.replace(/-/g, '').slice(2);
      url += `?date_from=${encodeURIComponent(yymmdd)}&date_to=${encodeURIComponent(yymmdd)}`;
    } else {
      url += '?per_page=1';
    }

    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const list = await response.json();
    if (!Array.isArray(list) || list.length === 0) {
      return null;
    }

    const item = list[0];
    let mediaUrl = item.hdurl;

    if (item.media_type === 'video') {
      const videoMatch = item.basic_html && (
        item.basic_html.match(/<source[^>]+src=["']([^"']+)["']/i) ||
        item.basic_html.match(/<iframe[^>]+src=["']([^"']+)["']/i)
      );
      mediaUrl = videoMatch ? videoMatch[1] : (item.hdurl || item.url);
    } else if (!mediaUrl && item.media_type === 'image') {
      const imgMatch = item.basic_html && item.basic_html.match(/<img[^>]+src=["']([^"']+)["']/i);
      mediaUrl = imgMatch ? imgMatch[1] : item.url;
    } else if (!mediaUrl) {
      mediaUrl = item.url;
    }

    return {
      date: item.date,
      title: item.title,
      explanation: decodeHtmlEntities(item.explanation),
      media_type: item.media_type || 'image',
      url: mediaUrl,
      hdurl: item.hdurl || mediaUrl,
    };
  } catch {
    return null;
  }
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/apod', async (req, res) => {
  const { date } = req.query;

  if (date !== undefined && (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date))) {
    return res.status(400).json({ error: 'The date parameter must use YYYY-MM-DD format.' });
  }

  const url = new URL(NASA_APOD_URL);
  url.searchParams.set('api_key', NASA_API_KEY);

  if (date) {
    url.searchParams.set('date', date);
  }

  try {
    const response = await fetch(url);

    if (response.ok) {
      const apod = await response.json();
      const mediaUrl = new URL(apod.url);

      // Verify that NASA APOD returned actual media rather than the broken scraper logo placeholder
      if (!/nasa-logo(?:@[\w.-]+)?\.(?:png|jpe?g|webp|svg)$/i.test(mediaUrl.pathname)) {
        return res.json(apod);
      }

      console.warn('NASA APOD returned a logo placeholder. Falling back to NASA APOD WordPress service.');
    } else {
      console.warn(`NASA APOD primary endpoint returned status ${response.status}. Falling back to NASA APOD WordPress service.`);
    }
  } catch (err) {
    console.warn('NASA APOD primary request failed. Falling back to NASA APOD WordPress service:', err.message);
  }

  // Fallback to NASA's official WordPress-backed APOD endpoint
  const fallbackApod = await fetchFromNasaWordpress(date);
  if (fallbackApod) {
    return res.json(fallbackApod);
  }

  console.error('Failed to retrieve astronomy picture from both primary and fallback NASA services.');
  return res.status(502).json({ error: 'Unable to retrieve the astronomy picture right now.' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}.`);
});
