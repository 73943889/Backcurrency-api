// src/routes/verifyuserRoutes.js
const express = require('express');
const router = express.Router();

// Importamos la función lógica
const verifyUserHandler = require('../GET/getVerifyUser');

// Definimos la ruta correctamente con el parámetro :id
router.get('/verify-user/:id', verifyUserHandler);

module.exports = router;