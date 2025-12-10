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