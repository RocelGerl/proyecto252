import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'mysql',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '123456',
  database: process.env.MYSQL_DB || 'todo_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;