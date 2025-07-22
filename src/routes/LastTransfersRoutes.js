const express = require('express');
const router = express.Router();
const getLastTransfers = require('../GET/getLastTransfers');

// 👇 Esto ya es una ruta completa (con `router.get(...)` dentro)
router.use('/', getLastTransfers);

module.exports = router;