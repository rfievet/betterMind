/**
 * Database connection and query utilities
 * Provides a connection pool and helper functions for database operations
 */

import { Pool, QueryResult, QueryResultRow } from 'pg';
import config from '../config';

/**
 * PostgreSQL connection pool
 * Reuses connections for better performance
 */
export const pool = new Pool({
  connectionString: config.database.url,
  // Maximum number of clients in the pool
  max: 20,
  // How long a client can remain idle before being closed
  idleTimeoutMillis: 30000,
  // How long to wait for a connection before timing out
  connectionTimeoutMillis: 2000,
});

/**
 * Test database connection
 * Should be called on application startup
 */
export async function testConnection(): Promise<void> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection established');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

/**
 * Execute a SQL query
 * @param text - SQL query string
 * @param params - Query parameters (prevents SQL injection)
 * @returns Query result
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries in development
    if (config.isDevelopment && duration > 1000) {
      console.warn(`⚠️  Slow query (${duration}ms):`, text);
    }
    
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  }
}

/**
 * Execute a query and return the first row
 * @param text - SQL query string
 * @param params - Query parameters
 * @returns First row or null if no results
 */
export async function queryOne<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] || null;
}

/**
 * Execute a query within a transaction
 * Automatically commits on success or rolls back on error
 * @param callback - Function that executes queries
 * @returns Result of the callback
 */
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close all database connections
 * Should be called on application shutdown
 */
export async function closePool(): Promise<void> {
  await pool.end();
  console.log('Database connection pool closed');
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});

export default {
  pool,
  query,
  queryOne,
  transaction,
  testConnection,
  closePool,
};
