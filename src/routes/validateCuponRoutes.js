const express = require('express');
const router = express.Router();

const validateCuponRoute = require('../POST/validateCupon');

router.use('/', validateCuponRoute); // Ruta completa: /api/cupones/validar

module.exports = router;