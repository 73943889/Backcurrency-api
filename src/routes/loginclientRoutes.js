// src/routes/loginclientRoutes.js
const express = require('express');
const router = express.Router();
const loginPersonalClient = require('../POST/login_personal_client');
router.post('/login', loginPersonalClient); // <-- OK
module.exports = router;