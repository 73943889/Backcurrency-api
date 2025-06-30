const express = require('express');
const router = express.Router();
const getRatesFromWesternUnion = require('../GET/getRatesWU');
const getRatesFromCambioEuro = require('../GET/getRatesCE');
const getRatesFromWi = require('../GET/getRatesWi');

router.get('/all', async (req, res) => {
  try {
    // Obtener las tasas de cambio solo una vez
    const wuRates = await getRatesFromWesternUnion();
    const ceRates = await getRatesFromCambioEuro();
    const wiRates = await getRatesFromWi();

    console.log("▶ wuRates:", wuRates);
    console.log("▶ ceRates:", ceRates);
    console.log("▶ wiRates:", wiRates);

    // Crear el objeto combinado con las tasas necesarias
    const combined = {
      "PEN a USD": {
        "compra": wuRates.penToUsd.compra,
        "venta": wuRates.penToUsd.venta
      },
      "USD a EUR": {
        "compra": ceRates.usdToEur.compra,
        "venta": ceRates.usdToEur.venta
      },
	   "PEN a EUR": {
		"compra": wiRates.penToEur.compra,
		"venta": wiRates.penToEur.venta
      }
    };

    // Enviar la respuesta al cliente
    res.json(combined);

  } catch (error) {
    console.error("Error fetching rates:", error);
    res.status(500).json({ error: "Error al obtener tasas de cambio" });
  }
});

module.exports = router;