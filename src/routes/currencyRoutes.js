const express = require('express');
const router = express.Router();
const { convertCurrency } = require('../services/currencyService');

router.get('/convert', async (req, res) => {
  const { from, to, amount } = req.query;

  if (!from || !to || !amount) {
    return res.status(400).json({ error: 'Parámetros faltantes.' });
  }

  try {
    const result = await convertCurrency(from, to, amount);
    res.json(result);
  } catch (error) {
    console.error('Error al realizar la conversión:', error.message);
    res.status(500).json({ error: 'Error al realizar la conversión.' });
  }
});

module.exports = router;