
# Deployment Guide for Ora Electronics (FREE Hosting Options)

This guide covers deploying your electronics e-commerce application using **FREE hosting services**.

## Project Architecture

- **Frontend**: Static HTML/CSS/JS files
- **Backend**: Node.js/Express API server  
- **Database**: PostgreSQL

---

## 🎯 RECOMMENDED: Vercel + Neon (100% Free)

### Step 1: Setup Free PostgreSQL Database on Neon

1. Go to [Neon.tech](https://neon.tech/) (Generous free tier)
2. Sign up with GitHub
3. Click **"Create a project"**
4. Configure:
   - **Project name**: `ora-electronics`
   - **Region**: Choose closest to your users
   - **PostgreSQL version**:s 16 (latest)
5. Click **"Create project"**
6. Copy the **Connection string** (format: `postgresql://user:pass@host/db`)
7. In Neon dashboard, go to **SQL Editor**
8. Paste and execute your `schema.sql` content

**Neon Free Tier Includes:**
- 0.5 GB storage
- Unlimited databases
- Auto-scale to zero (saves resources)
- No credit card required

### Step 2: Prepare Backend for Serverless Deployment

Create `api/index.js` in your project root:

```javascript
// api/index.js - Vercel serverless function
const app = require('../src/app'); // We'll create this

module.exports = app;
```

Create `src/app.js` (extract your Express app):

```javascript
// src/app.js
require('dotenv').config();
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

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.set('etag', false);

// API routes
app.use('/api', (req, res, next) => {
  delete req.headers['if-modified-since'];
  delete req.headers['if-none-match'];
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  next();
});

app.use('/api/products', productRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/sitemap', sitemapRoutes);
app.use('/api/verticals', verticalRoutes);
app.get('/api/search', searchController.handleSearch);
app.get('/api/category/:category', categoryController.getCategoryPage);
app.get('/api/product/:keyName', productPageController.getProductPage);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = app;
```

Update `src/index.js` to use the app:

```javascript
// src/index.js
const app = require('./app');
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Step 3: Create Vercel Configuration

Create `vercel.json` in project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    },
    {
      "src": "*.html",
      "use": "@vercel/static"
    },
    {
      "src": "src/**",
      "use": "@vercel/static"
    },
    {
      "src": "seo/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    },
    {
      "src": "/product/([^/]+)",
      "dest": "/products.html?name=$1"
    },
    {
      "src": "/mobiles-under-([0-9]+)",
      "dest": "/seo/pages/mobiles-under-$1.html"
    },
    {
      "src": "/samsung-mobiles",
      "dest": "/seo/pages/samsung-mobiles.html"
    },
    {
      "src": "/apple-mobiles",
      "dest": "/seo/pages/apple-mobiles.html"
    },
    {
      "src": "/oneplus-mobiles",
      "dest": "/seo/pages/oneplus-mobiles.html"
    },
    {
      "src": "/xiaomi-mobiles",
      "dest": "/seo/pages/xiaomi-mobiles.html"
    },
    {
      "src": "/mobiles-delhi",
      "dest": "/seo/pages/mobiles-delhi.html"
    },
    {
      "src": "/mobiles-mumbai",
      "dest": "/seo/pages/mobiles-mumbai.html"
    },
    {
      "src": "/search",
      "dest": "/search.html"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.js"
    }
  ]
}
```

### Step 4: Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Set environment variables in Vercel dashboard:
   - Go to your project → Settings → Environment Variables
   - Add:
     ```
     DATABASE_URL=<your-neon-connection-string>
     NODE_ENV=production
     ```

5. Deploy to production:
```bash
vercel --prod
```

**Vercel Free Tier Includes:**
- Unlimited deployments
- 100 GB bandwidth/month
- Auto HTTPS/SSL
- Global CDN
- No credit card required

---

## Alternative Option 1: Railway.app (Free Trial)

Railway still offers **$5 free trial credits** per month.

### Step 1: Setup on Railway

1. Go to [Railway.app](https://railway.app/)
2. Sign in with GitHub
3. Click **"New Project"**
4. Click **"Deploy from GitHub repo"**
5. Select your repository
6. Railway auto-detects Node.js

### Step 2: Add PostgreSQL

1. In your project, click **"New"** → **"Database"** → **"PostgreSQL"**
2. Railway provisions database automatically
3. Connection string auto-added as `DATABASE_URL`

### Step 3: Configure & Deploy

1. Add environment variables in **"Variables"** tab:
   ```
   NODE_ENV=production
   PORT=3001
   ```
2. Deploy happens automatically
3. Get your public URL from **"Settings"** → **"Domains"**

### Step 4: Run Database Schema

1. In Railway PostgreSQL service, click **"Connect"**
2. Use the provided `psql` command
3. Run your `schema.sql`

---

## Alternative Option 2: Cloudflare Pages + Workers + D1

### Step 1: Setup Cloudflare Account

1. Sign up at [Cloudflare](https://dash.cloudflare.com/)
2. Go to **Pages**

### Step 2: Create D1 Database (Cloudflare's SQLite)

```bash
npm install -g wrangler
wrangler login
wrangler d1 create ora-electronics-db
```

Note: D1 is SQLite-based, you'll need to adapt your PostgreSQL schema.

### Step 3: Deploy Frontend to Pages

1. Connect your GitHub repository
2. Build settings:
   - Build command: (leave empty)
   - Output directory: `/`
3. Deploy

### Step 4: Deploy Backend as Workers

Convert your Express routes to Cloudflare Workers format.

---

## Alternative Option 3: Netlify + Supabase

### Step 1: Setup Supabase Database

1. Go to [Supabase.com](https://supabase.com/)
2. Create new project (Free tier: 500 MB database)
3. Go to **SQL Editor**
4. Run your `schema.sql`
5. Get connection string from **Settings** → **Database**

### Step 2: Deploy Backend as Netlify Functions

Create `netlify/functions/api.js`:

```javascript
const serverless = require('serverless-http');
const app = require('../../src/app');

exports.handler = serverless(app);
```

Create `netlify.toml`:

```toml
[build]
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[redirects]]
  from = "/product/:name"
  to = "/products.html?name=:name"
  status = 200
```

### Step 3: Deploy

1. Connect GitHub to Netlify
2. Configure build settings
3. Add environment variable: `DATABASE_URL`
4. Deploy

**Netlify Free Tier:**
- 100 GB bandwidth/month
- 125k serverless function requests/month
- Auto HTTPS

---

## Alternative Option 4: Azure Static Web Apps (Free Tier)

### Setup:

1. Go to [Azure Portal](https://portal.azure.com/)
2. Create Static Web App (Free tier)
3. Connect GitHub repository
4. Azure auto-configures CI/CD

**Free Tier Includes:**
- 100 GB bandwidth/month
- Custom domains
- SSL included

---

## Database Comparison (Free Tiers)

| Provider | Storage | Connection Limit | Serverless | Credit Card |
|----------|---------|------------------|------------|-------------|
| **Neon** | 0.5 GB | Unlimited | ✅ Yes | ❌ No |
| **Supabase** | 500 MB | 100 | ✅ Yes | ❌ No |
| **Railway** | 5 GB* | 100 | ❌ No | ❌ No |
| **PlanetScale** | 5 GB* | 1000 | ✅ Yes | ✅ Yes |
| **ElephantSQL** | 20 MB | 5 | ❌ No | ❌ No |

*With free trial credits

---

## Recommended Setup: Vercel + Neon

**Pros:**
- Both 100% free forever
- No credit card needed
- Auto-scaling
- Global CDN
- Easy deployment
- Great DX

**Cons:**
- Serverless functions have cold starts
- 10s function timeout
- PostgreSQL connection pooling needed

---

## Connection Pooling for Serverless

For serverless deployments, use connection pooling to avoid "too many connections" error.

### Option A: Use Neon's Pooled Connection

Neon provides a pooled connection string automatically.

### Option B: Use Supabase Connection Pooler

Supabase has built-in connection pooling (port 6543).

### Option C: Add PgBouncer

Install:
```bash
npm install pg-pool
```

Update `src/config/db.js`:
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1, // Important for serverless!
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000
});

module.exports = pool;
```

---

## Post-Deployment Steps

1. ✅ Test all API endpoints
2. ✅ Update frontend API URLs to production URL
3. ✅ Test product pages
4. ✅ Verify search functionality
5. ✅ Check .htaccess rewrites working
6. ✅ Test mobile responsiveness
7. ✅ Configure custom domain (optional)
8. ✅ Setup monitoring

---

## Updating Frontend API URLs

In your frontend JavaScript files, update:

```javascript
// Before
const API_URL = 'http://localhost:3001/api';

// After
const API_URL = '/api'; // Vercel will handle routing
// OR
const API_URL = 'https://your-project.vercel.app/api';
```

---

## Troubleshooting

### Database Connection Issues
```javascript
// Check if DATABASE_URL is set
console.log('DB:', process.env.DATABASE_URL ? 'Connected' : 'Missing');
```

### CORS Issues
Update `src/app.js`:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
```

### Serverless Function Timeout
- Optimize database queries
- Add indexes
- Use connection pooling
- Consider caching

---

## Quick Deployment Commands

```bash
# Clone and setup
git clone <your-repo>
cd ora-electronics
npm install

# Deploy to Vercel
vercel login
vercel
vercel --prod

# Set environment variables
vercel env add DATABASE_URL
```

---

## Cost Summary

- **Neon Database**: $0/month (0.5 GB)
- **Vercel Hosting**: $0/month (100 GB bandwidth)
- **Domain** (optional): $12/year
- **Total**: **$0/month** (or $1/month if you buy domain)

---

## Next Steps After Deployment

1. Add your domain to Google Search Console
2. Submit sitemap.xml
3. Setup analytics (Google Analytics)
4. Monitor performance (Vercel Analytics)
5. Setup error tracking (Sentry)

Good luck with your deployment! 🚀

**Need help?** Open an issue on GitHub or check provider documentation.
