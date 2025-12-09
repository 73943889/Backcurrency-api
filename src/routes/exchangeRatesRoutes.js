const express = require('express');
const router = express.Router();
const getExchangeRates = require('../GET/getExchangeRates');

router.get('/rates', async (req, res) => {
  try {
    const rates = await getExchangeRates();
    res.json(rates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener tasas' });
  }
});

module.exports = router;