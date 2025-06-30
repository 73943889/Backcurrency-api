// src/routes/clientRoutes.js
const express = require('express');
const router = express.Router();
const registerUserGoogle=require('../POST/registerGoogleUser');
router.post('/registerUserGoogle', registerUserGoogle);
module.exports = router;