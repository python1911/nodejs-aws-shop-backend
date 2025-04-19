require('dotenv').config();
const http = require('http');
const url = require('url');
const { proxyRequest } = require('./utils/proxy');

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
  const recipientService = pathParts[0];

  const recipientBase = process.env[recipientService?.toUpperCase()];
  if (!recipientBase) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: 'Cannot process request' }));
  }

  const proxiedPath = pathParts.slice(1).join('/');
  const targetUrl = `${recipientBase}/${proxiedPath}${parsedUrl.search || ''}`;

  await proxyRequest(req, res, targetUrl);
});

server.listen(PORT, () => {
  console.log(`BFF Service listening on port ${PORT}`);
});
