const axios = require('axios');

async function proxyRequest(req, res, targetUrl) {
  try {
    const response = await axios({
      url: targetUrl,
      method: req.method,
      headers: req.headers,
      data: req,
      responseType: 'stream'
    });

    res.writeHead(response.status, response.headers);
    response.data.pipe(res);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || { message: 'Internal error' };
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(message));
  }
}

module.exports = { proxyRequest };
