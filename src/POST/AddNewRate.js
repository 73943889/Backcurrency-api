const pool = require('../db');

/**
 * Obtiene todas las tasas de cambio desde la base de datos.
 * Maneja GET /api/admin/rates
 */
const getAllRates = async (req, res) => {
    try {
        // 🛑 SOLUCIÓN CLAVE: Usamos AS (Alias) para renombrar los campos REALES de tu DB 
        // ('from_currency' y 'to_currency') y que el frontend los reciba como 
        // 'base_currency' y 'target_currency', que es lo que espera para mapear los campos.
        const sqlQuery = `
            SELECT 
                from_currency AS base_currency, 
                to_currency AS target_currency, 
                buy_rate, 
                sell_rate 
            FROM 
                exchange_rates
        `;
        const [rows] = await pool.execute(sqlQuery);
        
        res.status(200).json({ 
            success: true, 
            // La respuesta ahora contiene los nombres que necesita el JavaScript del frontend:
            // { base_currency: 'USD', target_currency: 'PEN', ... }
            rates: rows 
        });

    } catch (error) {
        console.error("[ADMIN] Error al obtener todas las tasas:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Fallo interno del servidor al obtener las tasas.' 
        });
    }
};

/**
 * Actualiza las 6 tasas de cambio recibidas en un solo cuerpo de petición.
 * Maneja POST /api/admin/rates/update-all
 */
const updateAllRates = async (req, res) => {
    // El frontend (después de recibir el GET) enviará los datos con los nombres:
    // { rates: [ {base_currency: 'USD', target_currency: 'PEN', buy_rate: ..., sell_rate: ...}, ... ] }
    const { rates } = req.body; 

    if (!rates || !Array.isArray(rates) || rates.length === 0) {
        return res.status(400).json({ success: false, message: 'Datos de tasas inválidos.' });
    }

    try {
        const updates = rates.map(rate => {
            const buy = parseFloat(rate.buy_rate);
            const sell = parseFloat(rate.sell_rate);
            
            // Los valores reales de las monedas ('USD', 'PEN') vienen en los campos base_currency y target_currency del payload
            const baseValue = rate.base_currency; 
            const targetValue = rate.target_currency;

            if (isNaN(buy) || isNaN(sell) || !baseValue || !targetValue) {
                 throw new Error(`Valor numérico o moneda inválida.`);
            }

            // En el UPDATE, usamos los nombres REALES de las columnas de tu DB (from_currency, to_currency)
            const updateQuery = `
                UPDATE exchange_rates
                SET buy_rate = ?, sell_rate = ?, updated_at = NOW()
                WHERE from_currency = ? AND to_currency = ?;
            `;
            
            // Pasamos los valores en el orden: [buy, sell, baseValue, targetValue]
            return pool.execute(updateQuery, [buy, sell, baseValue, targetValue]);
        });

        await Promise.all(updates);

        res.status(200).json({ 
            success: true, 
            message: 'Todas las tasas se han actualizado correctamente.' 
        });

    } catch (error) {
        console.error("[ADMIN] Error al actualizar todas las tasas:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Fallo interno del servidor al actualizar tasas.', 
            details: error.message
        });
    }
};

module.exports = {
    getAllRates,
    updateAllRates,
};