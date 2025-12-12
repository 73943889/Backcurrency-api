const db = require('../db'); // Asegúrate de que esta ruta sea correcta para db.js

// Función para obtener todas las tasas de cambio desde la BD
async function getExchangeRatesFromDB() {
    // Consulta SQL para obtener todas las tasas de cambio activas
    // **Asegúrate de que el nombre de la tabla (exchange_rates) sea el correcto en tu BD.**
    const query = `
        SELECT 
            base_currency, 
            target_currency, 
            buy_rate, 
            sell_rate, 
            updated_at
        FROM 
            exchange_rates
        WHERE 
            is_active = TRUE
        ORDER BY 
            base_currency, target_currency
    `;

    try {
        // Ejecuta la consulta a la BD. Usamos 'await' para esperar el resultado.
        const [rows] = await db.query(query);
        
        // Si no hay tasas, devolvemos un arreglo vacío
        if (rows.length === 0) {
            console.log("No se encontraron tasas de cambio activas en la BD.");
            return [];
        }

        return rows; // Retorna el array de tasas
        
    } catch (error) {
        console.error("Error al consultar las tasas de cambio en la BD:", error);
        // Lanza el error para que sea manejado por la capa de rutas (Controller)
        throw new Error("Fallo en la base de datos al obtener las tasas.");
    }
}

module.exports = {
    getExchangeRatesFromDB
};