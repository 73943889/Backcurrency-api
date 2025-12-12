const pool = require('../db'); 

/**
 * Obtiene todas las tasas de cambio desde la base de datos.
 * Maneja GET /api/admin/rates
 */
const getAllRates = async (req, res) => {
    try {
        // 🛑 CORRECCIÓN CLAVE: Usamos AS (Alias) para renombrar los campos de la DB 
        // y que el frontend los reciba como 'base_currency' y 'target_currency'.
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
            // Ahora 'rows' contendrá objetos con: {base_currency, target_currency, buy_rate, sell_rate}
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
    // 🛑 CAMBIO EN PAYLOAD: Asumimos que el frontend envía los campos con los nombres que recibe (base_currency, target_currency)
    const { rates } = req.body; 

    if (!rates || !Array.isArray(rates) || rates.length === 0) {
        return res.status(400).json({ success: false, message: 'Datos de tasas inválidos.' });
    }

    try {
        const updates = rates.map(rate => {
            const buy = parseFloat(rate.buy_rate);
            const sell = parseFloat(rate.sell_rate);
            
            // Asumiendo que el frontend envía base_currency y target_currency (que es lo que recibe en el GET)
            const base = rate.base_currency || rate.from_currency; 
            const target = rate.target_currency || rate.to_currency;

            if (isNaN(buy) || isNaN(sell) || !base || !target) {
                 throw new Error(`Valor numérico o moneda inválida para el par.`);
            }

            // En el UPDATE, usamos los nombres REALES de la DB (from_currency, to_currency)
            const updateQuery = `
                UPDATE exchange_rates
                SET buy_rate = ?, sell_rate = ?, updated_at = NOW()
                WHERE from_currency = ? AND to_currency = ?;
            `;
            
            // Pasamos los valores: [buy, sell, base_value, target_value]
            return pool.execute(updateQuery, [buy, sell, base, target]);
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