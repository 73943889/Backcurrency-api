require('dotenv').config();
const mysql = require('mysql2/promise');

const isRailway = !!process.env.DB_HOST;

const db = mysql.createPool({
  host: isRailway ? process.env.DB_HOST : 'localhost',
  user: isRailway ? process.env.DB_USER : 'root',
  password: isRailway ? process.env.DB_PASSWORD : '',
  database: isRailway ? process.env.DB_NAME : 'currency_db',
  port: isRailway ? Number(process.env.DB_PORT) : 3306,
  ssl: isRailway ? { rejectUnauthorized: false } : false,

  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  connectTimeout: 10000
});

// ✅ Test automático de conexión
db.getConnection()
  .then(conn => {
    console.log("✅ MySQL conectado correctamente");
    conn.release();
  })
  .catch(err => {
    console.error("❌ Error conectando a MySQL:", err.message);
  });

module.exports = db;