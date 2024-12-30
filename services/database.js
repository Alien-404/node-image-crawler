require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || '5432',
});

async function getTables() {
  const query = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `;
  const result = await pool.query(query);
  return result.rows.map(row => row.table_name);
}

async function getTableColumns(tableName) {
  const query = `
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = $1
  `;
  const result = await pool.query(query, [tableName]);
  return result.rows;
}

async function getTablePreview(tableName, columns, limit = 10) {
  const query = `
    SELECT ${columns.join(', ')} 
    FROM ${tableName} 
    LIMIT $1
  `;
  const result = await pool.query(query, [limit]);
  return result.rows;
}

async function getTableCount(tableName) {
  const query = `SELECT COUNT(*) FROM ${tableName}`;
  const result = await pool.query(query);
  return parseInt(result.rows[0].count);
}

module.exports = {
  pool,
  getTables,
  getTableColumns,
  getTablePreview,
  getTableCount
};
