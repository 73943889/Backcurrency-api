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
const env = process.env.RAILWAY_ENV;

// 1. Configuración para AMBIENTES DESPLEGADOS (Railway)
if (env === 'staging' || env === 'production') {
    // Priorizamos el uso de MYSQL_URL si existe, sino, usamos las variables separadas STAGING/PROD
    const connectionUri = process.env.MYSQL_URL; 

    if (connectionUri) {
        dbConfig = {
            uri: connectionUri,
            ssl: { rejectUnauthorized: false },
        };
        console.log(`ℹ️ Configuración usando ${env} (Vía MYSQL_URL)`);
    } else {
        // Fallback a variables STAGING/PROD (la configuración que sabes que funciona)
        dbConfig = {
            host: process.env.STAGING_DB_HOST || process.env.PROD_DB_HOST,
            user: process.env.STAGING_DB_USER || process.env.PROD_DB_USER,
            password: process.env.STAGING_DB_PASSWORD || process.env.PROD_DB_PASSWORD,
            database: process.env.STAGING_DB_NAME || process.env.PROD_DB_NAME,
            port: Number(process.env.STAGING_DB_PORT) || Number(process.env.PROD_DB_PORT),
            ssl: { rejectUnauthorized: false },
        };
        console.log(`ℹ️ Configuración usando ${env} (Vía Variables Separadas)`);
    }

} else {
    // 2. Configuración LOCAL (default)
    dbConfig = {
        host: process.env.LOCAL_DB_HOST,
        user: process.env.LOCAL_DB_USER,
        password: process.env.LOCAL_DB_PASSWORD,
        database: process.env.LOCAL_DB_NAME,
        port: Number(process.env.LOCAL_DB_PORT),
        ssl: false,
    };
    console.log(`ℹ️ Configuración usando local`);
}

// ===============================================
// ⚙️ CREACIÓN DEL POOL DE CONEXIONES (LIMPIADO Y ROBUSTO)
// ===============================================

const db = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    connectTimeout: 15000,
});

// ... (El resto del código de prueba de conexión sigue igual)

module.exports = db;