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

// Detectar si la aplicación se está ejecutando dentro de Railway (staging/production)
const isRailwayEnv = env === 'staging' || env === 'production';

// ===============================================
// 🚀 CONFIGURACIÓN DE CONEXIÓN A LA BASE DE DATOS
// ===============================================

if (isRailwayEnv) {
  // Cuando se ejecuta en Railway (staging o production)
  // Usamos las variables de entorno inyectadas por Railway para la red INTERNA
  dbConfig = {
    // Variables de red interna de MySQL en Railway
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: Number(process.env.MYSQLPORT),
    
    // El SSL es a menudo necesario incluso en la red interna para la seguridad, 
    // pero configurado para aceptar certificados no autorizados comunes en PaaS.
    ssl: { rejectUnauthorized: false }, 
  };

  // Pequeña mejora de logs para ver qué ambiente se usa realmente
  console.log(`ℹ️ Configuración usando ${env} (Red Interna Railway)`);

} else {
  // Cuando se ejecuta localmente (default)
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
// ⚙️ CREACIÓN DEL POOL DE CONEXIONES
// ===============================================

const db = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  connectTimeout: 10000 // Aumentado ligeramente para mayor robustez
});

// ===============================================
// 🤝 PRUEBA DE CONEXIÓN
// ===============================================

db.getConnection()
  .then(conn => {
    console.log(`✅ MySQL conectado correctamente a ${env || 'local'} en host: ${dbConfig.host}`);
    conn.release();
  })
  .catch(err => {
    // Aquí se mostraría el error si falla la conexión
    console.error("❌ Error conectando a MySQL:", err.message);
  });

module.exports = db;