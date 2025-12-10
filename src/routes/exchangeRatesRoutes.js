const express = require('express');
const router = express.Router();
const getExchangeRates = require('../GET/getExchangeRates');

// 💡 CORRECCIÓN EN EL ROUTER: solo el final de la ruta '/rates'
router.get('/rates', async (req, res) => {
    try {
        const rates = await getExchangeRates();
        
        // 🚨 Respuesta JSON para Kotlin (directo el mapa)
        return res.json(rates); 
        
    } catch (error) {
        console.error("❌ Error en /api/exchange/rates:", error.message);
        // Es esencial que siempre devuelvas un objeto JSON en caso de error 500
        return res.status(500).json({
            success: false,
            message: "Error al obtener tasas: " + error.message 
        });
    }
});

module.exports = router;