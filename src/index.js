require('dotenv').config();
/**
 * Main entry for the ora backend API server (local development)
 * For serverless deployment, see api/index.js
 */
const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 3001;

// Test DB connection and start server
db.connect()
  .then(() => {
    console.log('✅ Database connected successfully!');
    app.listen(PORT, () => {
      console.log(`🟢 ora backend running at http://localhost:${PORT}`);
    });
  })
  .catch(error => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });