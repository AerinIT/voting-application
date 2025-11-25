const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy API requests to the backend server
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.NODE_ENV === 'production' ? 'http://voting-app-server:5000' : 'http://localhost:5000',
      changeOrigin: true,
    })
  );
};