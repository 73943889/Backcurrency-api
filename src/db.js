/*const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la base de datos (Usando conexión pool para mejor rendimiento)
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Breyner2205*',
    database: process.env.DB_NAME || 'BDD_transfer',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
	 uri: process.env.DATABASE_URL	
});
module.exports = db;*/
require('dotenv').config();
const mysql = require('mysql2/promise');

let db;

if (process.env.MYSQL_URL) {
  const url = new URL(process.env.MYSQL_URL);
  db = mysql.createPool({
    host: url.hostname,
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', ''),
    port: Number(url.port),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
} else {
  db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

module.exports = db;