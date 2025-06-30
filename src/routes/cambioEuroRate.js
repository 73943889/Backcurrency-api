const express = require('express');
const router = express.Router();
const getCambioEuro = require('../GET/getRatesCE');

router.get('/change-euro-rates', async (req, res) => {
  try {
    const rates = await getCambioEuro();
    res.json(rates); // { compra: "3.78", venta: "3.84" }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;