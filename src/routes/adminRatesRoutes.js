const express = require('express');
const router = express.Router();

// Importamos la función de servicio que obtiene las tasas (la que ya tienes)
const getExchangeRates = require('../GET/getExchangeRates'); 

// Importamos el middleware de autenticación (clave para el administrador)
const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * @route GET /api/admin/rates
 * @description Obtiene las tasas para el Panel de Administración (Requiere Token Admin).
 * @access Privada (Solo Admin)
 */
router.get('/rates', authMiddleware, async (req, res) => { // <-- Aquí se aplica el middleware
    try {
        const rates = await getExchangeRates();
        
        // El front-end del Admin Panel consumirá esta ruta
        return res.json({
            success: true,
            data: rates
        });
        
    } catch (error) {
        console.error("❌ Error en la ruta /api/admin/rates:", error.message);
        return res.status(500).json({
            success: false,
            message: "Error al obtener tasas para el panel de administración."
        });
    }
});

module.exports = router;