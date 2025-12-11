// src/POST/updateTransfer.js

const db = require('../db'); // Asegúrese de que esta ruta sea correcta para su conexión BD

const updateStatusHandler = async (req, res) => {
    // req.user.id contiene el username del admin que está haciendo el cambio (de authAdmin)
    const adminUser = req.user.id; 
    const { transferId, nuevoEstado } = req.body; 

    // Opcional: Validación para asegurar que nuevoEstado es un valor permitido.

    try {
        await db.query(`UPDATE transferencias SET estado = ? WHERE id = ?`, 
                        [nuevoEstado, transferId]);
        
        // Log de Auditoría para saber quién y cuándo hizo el cambio
        console.log(`[ADMIN 🟢] Admin ${adminUser} actualizó T-${transferId} a: ${nuevoEstado}`);

        res.status(200).json({ 
            success: true, 
            message: `Transferencia ${transferId} actualizada a ${nuevoEstado}` 
        });

    } catch (error) {
        console.error(`[ADMIN 🔴] Fallo crítico al actualizar estado: ${error.message}`);
        res.status(500).json({ success: false, message: "Error interno al actualizar estado." });
    }
};

module.exports = updateStatusHandler;