
/**
 * PostgreSQL connection pool configuration for ora backend.
 * Optimized for both local development and serverless deployment (Vercel).
 * Connects using the DATABASE_URL environment variable.
 */
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  // Serverless-friendly settings
  max: 1, // Limit connections for serverless
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
});

module.exports = pool;
