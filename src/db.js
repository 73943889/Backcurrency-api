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
    queueLimit: 0
		
});
module.exports = db;*/
const mysql = require('mysql2/promise');
require('dotenv').config();

// Conexión con URL completa desde Railway
const db = mysql.createPool(process.env.DATABASE_URL);

module.exports = db;
