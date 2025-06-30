const express = require('express');
const router = express.Router();
const getWesternUnionRates = require('../GET/getRatesWU');

router.get('/western-union-rates', async (req, res) => {
  try {
    const rates = await getWesternUnionRates();
    res.json(rates); // { compra: "3.78", venta: "3.84" }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;