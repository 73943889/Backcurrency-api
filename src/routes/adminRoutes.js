// src/routes/adminRoutes.js

const express = require('express');
const router = express.Router();

// Importar controladores y middleware
const adminLoginHandler = require('../POST/adminLogin');
const updateStatusHandler = require('../POST/updateTransfer');
const authAdmin = require('../middleware/authAdmin'); 

// 1. Ruta pública para obtener el Token (No necesita protección)
router.post('/login', adminLoginHandler);

// 2. Ruta protegida para cambiar el estado (Requiere el Token de Administrador)
router.post('/transfer/update', authAdmin, updateStatusHandler); 

module.exports = router;