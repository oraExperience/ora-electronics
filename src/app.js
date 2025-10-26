require('dotenv').config();
/**
 * Express app configuration for ora backend
 * Separated from index.js to work with both local server and serverless (Vercel)
 */
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const productRoutes = require('./routes/productRoutes');
const storeRoutes = require('./routes/storeRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const imageRoutes = require('./routes/imageRoutes');
const sitemapRoutes = require('./routes/sitemapRoutes');
const searchController = require('./controllers/searchController');
const categoryController = require('./controllers/categoryController');
const productPageController = require('./controllers/productPageController');
const verticalRoutes = require('./routes/verticalRoutes');

const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Disable ETag generation
app.set('etag', false);

// Middleware to disable caching for API routes
app.use('/api', (req, res, next) => {
  delete req.headers['if-modified-since'];
  delete req.headers['if-none-match'];
  
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Last-Modified': '',
    'ETag': ''
  });
  next();
});

// Serve static files
app.use(express.static('.'));

// Server-side rendered search route
app.get('/search', searchController.renderSearchPage);

// Server-side rendered category routes
app.get('/mobiles', categoryController.renderCategoryPage);
app.get('/laptops', categoryController.renderCategoryPage);
app.get('/tvs', categoryController.renderCategoryPage);
app.get('/accessories', categoryController.renderCategoryPage);

app.get('/product', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile('products.html', { root: '.' });
});

// SEO-friendly product URLs route
app.get('/product/:productName', productPageController.renderProductPage);

// Mount API routes
app.use('/api/reviews', reviewRoutes);
app.use('/api/verticals', verticalRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/images', imageRoutes);

// Sitemap routes
app.use('/', sitemapRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send({ message: 'ora API server is running' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
