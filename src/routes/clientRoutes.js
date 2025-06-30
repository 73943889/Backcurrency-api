// src/routes/clientRoutes.js
const express = require('express');
const router = express.Router();
const registPersClient = require('../POST/register_personal_client');
router.post('/registerPersonalClient', registPersClient);
module.exports = router;