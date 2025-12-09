/*require('dotenv').config();
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

module.exports = db;*/

require('dotenv').config();
const mysql = require('mysql2/promise');

let dbConfig;

switch (process.env.RAILWAY_ENV) {
  case 'staging':
    dbConfig = {
      host: process.env.STAGING_DB_HOST,
      user: process.env.STAGING_DB_USER,
      password: process.env.STAGING_DB_PASSWORD,
      database: process.env.STAGING_DB_NAME,
      port: Number(process.env.STAGING_DB_PORT),
      ssl: { rejectUnauthorized: false },
    };
    break;
  case 'production':
    dbConfig = {
      host: process.env.PROD_DB_HOST,
      user: process.env.PROD_DB_USER,
      password: process.env.PROD_DB_PASSWORD,
      database: process.env.PROD_DB_NAME,
      port: Number(process.env.PROD_DB_PORT),
      ssl: { rejectUnauthorized: false },
    };
    break;
  default: // local
    dbConfig = {
      host: process.env.LOCAL_DB_HOST,
      user: process.env.LOCAL_DB_USER,
      password: process.env.LOCAL_DB_PASSWORD,
      database: process.env.LOCAL_DB_NAME,
      port: Number(process.env.LOCAL_DB_PORT),
      ssl: false,
    };
}

const db = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  connectTimeout: 10000
});

db.getConnection()
  .then(conn => {
    console.log("✅ MySQL conectado correctamente a", process.env.RAILWAY_ENV);
    conn.release();
  })
  .catch(err => {
    console.error("❌ Error conectando a MySQL:", err.message);
  });

module.exports = db;