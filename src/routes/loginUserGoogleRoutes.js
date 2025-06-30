// src/routes/loginclientRoutes.js
const express = require('express');
const router = express.Router();
const loginUserGoogle = require('../POST/login_user_google');
router.post('/login', loginUserGoogle); // <-- OK
module.exports = router;