const express = require('express');
const router = express.Router();
const pool = require('../db'); // Asegúrate de que esta ruta sea correcta

// ✅ Obtener transferencias por ID de usuario
router.get('/user/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const [result] = await pool.query(
            'SELECT * FROM transfers WHERE user_id = ? ORDER BY fecha DESC LIMIT 10',
            [userId]
        );

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error al obtener movimientos:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});

module.exports = router;