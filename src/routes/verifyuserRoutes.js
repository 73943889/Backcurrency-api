// src/routes/verifyuserRoutes.js
const express = require('express');
const router = express.Router();

// Verifica que la carpeta sea GET y el archivo getVerifyUser exactamente
const getVerifyUser = require('../GET/getVerifyUsers'); 

router.get('/verify-user/:id', getVerifyUser);

module.exports = router;