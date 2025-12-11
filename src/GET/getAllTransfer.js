// src/GET/getAllTransfers.js

const db = require('../db'); 

const getAllTransfersHandler = async (req, res) => {
    try {
        const [results] = await db.query(
            `SELECT 
                t.id, 
                t.nombre,              -- Nombre del cliente (desde la tabla transferencias)
                t.dni,                 -- DNI del cliente
                t.monto, 
                t.moneda,              -- Asumo que la moneda está en la tabla transferencias
                t.banco,
                t.comprobante_url,     -- URL del comprobante
                t.cod_aprobacion,      -- Código de aprobación
                t.fecha,               -- 💡 CORRECCIÓN: Usamos 'fecha' en lugar de 'fecha_registro'
                t.estado,              -- 💡 AHORA EXISTE: Usamos la nueva columna 'estado'
                u.email AS user_email  -- Email del usuario (desde la tabla users)
             FROM transferencias t
             JOIN users u ON t.user_id = u.id 
             ORDER BY t.fecha DESC`
        );
        
        console.log(`[ADMIN 🟢] Admin ${req.user.id} solicitó ${results.length} transferencias.`);

        res.status(200).json({ success: true, transfers: results });

    } catch (error) {
        console.error(`[ADMIN 🔴] Fallo al obtener todas las transferencias: ${error.message}`);
        res.status(500).json({ success: false, message: "Error interno al obtener transferencias." });
    }
};

module.exports = getAllTransfersHandler;