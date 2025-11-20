const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const httpPort = 8000;
const httpsPort = 8443;

// Request handler
const requestHandler = (req, res) => {
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  const extname = path.extname(filePath);
  let contentType = 'text/html';
  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
      contentType = 'image/jpg';
      break;
    case '.wav':
      contentType = 'audio/wav';
      break;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      // Add CORS headers for CDN usage
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end(content, 'utf-8');
    }
  });
};

// Start HTTP server
const httpServer = http.createServer(requestHandler);
httpServer.listen(httpPort, () => {
  console.log(`✅ HTTP Server: http://localhost:${httpPort}/`);
});

// Check for SSL certificates and start HTTPS server
const certPath = path.join(__dirname, 'localhost.pem');
const keyPath = path.join(__dirname, 'localhost-key.pem');

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };

  const httpsServer = https.createServer(httpsOptions, requestHandler);
  httpsServer.listen(httpsPort, () => {
    console.log(`✅ HTTPS Server: https://localhost:${httpsPort}/`);
    console.log('');
    console.log('🎉 Ready for CDN testing!');
    console.log(`   Use this URL in bookmarklet: https://localhost:${httpsPort}/device-tester-cdn.html`);
  });
} else {
  console.log('');
  console.log('⚠️  HTTPS not enabled (certificates not found)');
  console.log('');
  console.log('📝 To enable HTTPS (required for HTTPS production apps):');
  console.log('');
  console.log('   Option 1: Using mkcert (Recommended)');
  console.log('   ----------------------------------------');
  console.log('   1. Install: brew install mkcert');
  console.log('   2. Setup CA: mkcert -install');
  console.log('   3. Generate: mkcert localhost 127.0.0.1 ::1');
  console.log('   4. Rename: mv localhost+2.pem localhost.pem');
  console.log('   5. Rename: mv localhost+2-key.pem localhost-key.pem');
  console.log('   6. Restart: node server.js');
  console.log('');
  console.log('   Option 2: Using OpenSSL (Manual)');
  console.log('   ----------------------------------------');
  console.log('   openssl req -nodes -new -x509 -keyout localhost-key.pem -out localhost.pem -days 365');
  console.log('');
}