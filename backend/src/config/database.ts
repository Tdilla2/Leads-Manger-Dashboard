import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'leads_manager',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 1,
  idleTimeoutMillis: 120000,
  connectionTimeoutMillis: 5000,
  ssl: { rejectUnauthorized: false },
});

export default pool;
