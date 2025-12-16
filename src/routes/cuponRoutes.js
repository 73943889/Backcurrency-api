const express = require('express');
const router = express.Router();

// Verifica que las mayúsculas sean exactas a la imagen image_f85dc1.png
const getVerifyUser = require('../GET/getVerifyUser'); 

router.get('/verify-user/:id', getVerifyUser);

module.exports = router;