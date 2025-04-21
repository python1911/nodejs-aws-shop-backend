const axios = require('axios');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 120 }); // 2 minutes TTL

const cacheKeyFromRequest = (req) => `${req.method}_${req.originalUrl}`;

async function proxyRequest(req, res, recipientUrl) {
  const fullUrl = `${recipientUrl}${req.originalUrl.replace(/\/[^/]+/, '')}`;
  const cacheKey = cacheKeyFromRequest(req);

  if (req.method === 'GET' && req.originalUrl.includes('/products')) {
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }
  }

  try {
    const response = await axios({
      method: req.method,
      url: fullUrl,
      headers: req.headers,
      data: req.body,
    });

    if (req.method === 'GET' && req.originalUrl.includes('/products')) {
      cache.set(cacheKey, response.data);
    }

    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 502;
    const message = error.response?.data || { message: 'Error proxying request' };
    res.status(status).json(message);
  }
}

module.exports = proxyRequest;
