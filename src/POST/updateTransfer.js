// src/POST/updateTransfer.js

const db = require('../db'); // Asegúrese de que esta ruta sea correcta para su conexión BD (src/db.js)

const updateStatusHandler = async (req, res) => {
    // req.user.id contiene el username del admin que está haciendo el cambio (proviene del middleware authAdmin)
    const adminUser = req.user.id; 
    const { transferId, nuevoEstado } = req.body; 

    // Opcional: Validación para asegurar que nuevoEstado es un valor permitido.
    // Ej: if (!['PENDIENTE', 'COMPLETADA', 'RECHAZADA'].includes(nuevoEstado)) { return res.status(400).json({ message: "Estado inválido." }); }

    try {
        // La consulta SQL actualiza la columna 'estado'
        await db.query(`UPDATE transfers SET estado = ? WHERE id = ?`, 
                        [nuevoEstado, transferId]);
        
        // Log de Auditoría para saber quién y cuándo hizo el cambio
        console.log(`[ADMIN 🟢] Admin ${adminUser} actualizó T-${transferId} a: ${nuevoEstado}`);

        // Opcional: Aquí podría ir la lógica para enviar una notificación al cliente sobre el cambio de estado.

        res.status(200).json({ 
            success: true, 
            message: `Transferencia ${transferId} actualizada a ${nuevoEstado}` 
        });

    } catch (error) {
        // Si el fallo es en la BD (ej. el ID no existe o la conexión falló)
        console.error(`[ADMIN 🔴] Fallo crítico al actualizar estado: ${error.message}`);
        res.status(500).json({ success: false, message: "Error interno al actualizar estado." });
    }
};

module.exports = updateStatusHandler;