/**
 * Optional Express Server Route Proxy for NASA GIBS & EONET
 * 
 * Provides an Express.js implementation of:
 * - GET /api/nasa/gibs-image (Dynamic WMS GetMap proxy to prevent CORS and canvas tainting)
 * - GET /api/nasa/events (EONET v3 proxy)
 * 
 * Usage:
 *   node scripts/express_nasa_proxy.cjs
 */
const http = require('http');
const https = require('https');
const url = require('url');

const PORT = process.env.PROXY_PORT || 8080;
const GIBS_BASE = 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi';

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // 1. Route: /api/nasa/gibs-image
  if (pathname === '/api/nasa/gibs-image') {
    const lat = parseFloat(query.lat || '0');
    const lon = parseFloat(query.lon || '0');
    const date = query.date || new Date().toISOString().slice(0, 10);
    const delta = parseFloat(query.delta || '5.0');
    const layer = query.layer || 'MODIS_Terra_CorrectedReflectance_TrueColor,Coastlines_15m';
    const width = query.width || '800';
    const height = query.height || '600';
    const format = query.format || 'image/jpeg';

    const minLat = Math.max(-90, lat - delta).toFixed(4);
    const maxLat = Math.min(90, lat + delta).toFixed(4);
    const minLon = Math.max(-180, lon - delta).toFixed(4);
    const maxLon = Math.min(180, lon + delta).toFixed(4);
    const bbox = `${minLat},${minLon},${maxLat},${maxLon}`;

    const gibsUrl = `${GIBS_BASE}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=${encodeURIComponent(layer)}&CRS=EPSG:4326&BBOX=${bbox}&TIME=${date}&WIDTH=${width}&HEIGHT=${height}&FORMAT=${encodeURIComponent(format)}`;

    https.get(gibsUrl, (gibsRes) => {
      res.writeHead(gibsRes.statusCode || 200, {
        'Content-Type': gibsRes.headers['content-type'] || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      });
      gibsRes.pipe(res);
    }).on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch from NASA GIBS', details: err.message }));
    });
    return;
  }

  // 2. Route: /api/nasa/events (Forward to NASA EONET v3)
  if (pathname === '/api/nasa/events') {
    const eonetUrl = 'https://eonet.gsfc.nasa.gov/api/v3/events?category=severeStorms&status=all&limit=25';
    https.get(eonetUrl, (eonetRes) => {
      let body = '';
      eonetRes.on('data', chunk => body += chunk);
      eonetRes.on('end', () => {
        res.writeHead(eonetRes.statusCode || 200, {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(body);
      });
    }).on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch from NASA EONET', details: err.message }));
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found', routes: ['/api/nasa/gibs-image', '/api/nasa/events'] }));
});

server.listen(PORT, () => {
  console.log(`[NASA Express Proxy] Server listening on http://localhost:${PORT}`);
  console.log(`- GIBS Image Proxy: http://localhost:${PORT}/api/nasa/gibs-image?lat=13.2&lon=-100.0&date=2026-09-28`);
  console.log(`- EONET Proxy:      http://localhost:${PORT}/api/nasa/events`);
});
