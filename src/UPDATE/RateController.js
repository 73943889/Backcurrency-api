const pool = require('../db');
/**
 * Obtiene todas las tasas de cambio desde la base de datos.
 * Maneja GET /api/admin/rates
 */
const getAllRates = async (req, res) => {
    try {
        // Asumiendo que tu tabla de tasas se llama 'exchange_rates'
        const [rows] = await pool.execute('SELECT from_currency, to_currency, buy_rate, sell_rate FROM exchange_rates');
        
        res.status(200).json({ 
            success: true, 
            rates: rows // Array de 6 objetos {from_currency, to_currency, buy_rate, sell_rate}
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
    // El frontend envía: { rates: [ {from_currency, to_currency, buy_rate, sell_rate}, ... ] }
    const { rates } = req.body; 

    if (!rates || !Array.isArray(rates) || rates.length === 0) {
        return res.status(400).json({ success: false, message: 'Datos de tasas inválidos.' });
    }

    try {
        const updates = rates.map(rate => {
            const buy = parseFloat(rate.buy_rate);
            const sell = parseFloat(rate.sell_rate);
            
            if (isNaN(buy) || isNaN(sell)) {
                throw new Error(`Valor numérico inválido para el par ${rate.from_currency}-${rate.to_currency}`);
            }

            // Consulta de actualización: Asume que tienes un registro único por par de divisas (from_currency, to_currency)
            const updateQuery = `
                UPDATE exchange_rates
                SET buy_rate = ?, sell_rate = ?, updated_at = NOW()
                WHERE from_currency = ? AND to_currency = ?;
            `;
            
            return pool.execute(updateQuery, [buy, sell, rate.from_currency, rate.to_currency]);
        });

        // Ejecutar todas las actualizaciones de forma concurrente
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