// server.js
import http from 'http';
import { parse } from 'url';
import { StringDecoder } from 'string_decoder';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '123456',
  database: process.env.MYSQL_DB || 'proyecto',
  waitForConnections: true,
  connectionLimit: 10
});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

async function initializeDB() {
  let retries = 5;
  while (retries > 0) {
    try {
      const conn = await pool.getConnection();
      await conn.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(100) NOT NULL,
          description TEXT,
          priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
          completed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;
      `);
      conn.release();
      console.log('Tabla tasks creada exitosamente');
      return;
    } catch (err) {
      console.error(`❌ Intento fallido (${retries} restantes):`, err.message);
      retries--;
      await new Promise(res => setTimeout(res, 5000));
    }
  }
  throw new Error('No se pudo conectar a MySQL después de 5 intentos');
}

const server = http.createServer(async (req, res) => {
  const { pathname } = parse(req.url, true);
  const method = req.method.toUpperCase();

  // Handle Preflight (OPTIONS)
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      ...CORS_HEADERS,
      'Content-Length': '0'
    });
    res.end();
    return;
  }

  const decoder = new StringDecoder('utf-8');
  let buffer = '';

  req.on('data', (data) => buffer += decoder.write(data));
  req.on('end', async () => {
    buffer += decoder.end();
    const data = buffer ? JSON.parse(buffer) : {};
    const route = pathname.replace(/^\/+|\/+$/g, '');

    try {
      if (route === 'api/tasks') {
        if (method === 'GET') {
          const [tasks] = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
          respond(res, 200, tasks);
        } else if (method === 'POST') {
          const [result] = await pool.query('INSERT INTO tasks SET ?', {
            title: data.title,
            description: data.description,
            priority: data.priority || 'medium'
          });
          respond(res, 201, { id: result.insertId });
        }
      } else if (route.startsWith('api/tasks/')) {
        const id = route.split('/')[2];
        if (method === 'PUT') {
          await pool.query(
            'UPDATE tasks SET title=?, description=?, priority=? WHERE id=?',
            [data.title, data.description, data.priority, id]
          );
          respond(res, 200, { success: true });
        } else if (method === 'DELETE') {
          await pool.query('DELETE FROM tasks WHERE id=?', [id]);
          respond(res, 200, { success: true });
        } else if (method === 'PATCH') {
          await pool.query(
            'UPDATE tasks SET completed=? WHERE id=?',
            [data.completed, id]
          );
          respond(res, 200, { success: true });
        } else {
          respond(res, 405, { error: 'Método no permitido' });
        }
      } else {
        respond(res, 404, { error: 'Ruta no encontrada' });
      }
    } catch (err) {
      console.error('Error:', err);
      respond(res, 500, { error: 'Error interno del servidor' });
    }
  });

  // Set CORS headers
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
});

function respond(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const PORT = 3000;
initializeDB().then(() => {
  server.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
});