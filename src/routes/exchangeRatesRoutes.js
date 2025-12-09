const express = require('express');
const router = express.Router();
const getExchangeRates = require('../GET/getExchangeRates');

router.get('/rates', async (req, res) => {
  try {
    const rates = await getExchangeRates();

    return res.json({
      success: true,
      rates
    });

  } catch (error) {
    console.error("❌ Error en /api/rates:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener tasas"
    });
  }
});

module.exports = router;