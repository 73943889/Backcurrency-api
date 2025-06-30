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
const mysql = require('mysql2/promise');
require('dotenv').config();

const url = new URL(process.env.MYSQL_URL);

const db = mysql.createPool({
  host: url.hostname,
  user: url.username,
  password: url.password,
  database: url.pathname.replace('/', ''),
  port: Number(url.port),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db;