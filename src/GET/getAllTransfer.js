// src/GET/getAllTransfers.js

const db = require('../db'); 

const getAllTransfersHandler = async (req, res) => {
    // Nota: El middleware authAdmin ya verificó que es un administrador.

    try {
        // Consulta SQL para obtener TODAS las transferencias sin importar el estado
        const [results] = await db.query(
            `SELECT 
                t.id, 
                t.monto, 
                t.moneda,
                t.banco,
                t.fecha,
                t.estado,
                u.nombre AS user_nombre,
                u.email AS user_email
             FROM transferencias t
             JOIN users u ON t.user_id = u.id 
             ORDER BY t.fecha_registro DESC` // Ordenadas por la más reciente
        );
        
        console.log(`[ADMIN 🟢] Admin ${req.user.id} solicitó ${results.length} transferencias.`);

        // Devolver TODA la data para que el frontend la filtre
        res.status(200).json({ success: true, transfers: results });

    } catch (error) {
        console.error(`[ADMIN 🔴] Fallo al obtener todas las transferencias: ${error.message}`);
        res.status(500).json({ success: false, message: "Error interno al obtener transferencias." });
    }
};

module.exports = getAllTransfersHandler;