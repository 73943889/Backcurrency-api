// src/routes/adminRoutes.js

const express = require('express');
const router = express.Router();

// Importar controladores y middleware
const adminLoginHandler = require('../POST/adminLogin');
const updateStatusHandler = require('../POST/updateTransfer');
const getAllTransfersHandler = require('../GET/getAllTransfer'); 
const authAdmin = require('../middleware/authAdmin'); // <-- Usaremos este nombre
const RateController = require('../UPDATE/RateController');

// 1. Ruta pública para obtener el Token (No necesita protección)
router.post('/login', adminLoginHandler);

// 2. Rutas Protegidas (Requieren el Token de Administrador)

// Gestión de Transferencias
router.get('/transfers/all', authAdmin, getAllTransfersHandler);
router.post('/transfer/update', authAdmin, updateStatusHandler); 

// Gestión de Tasas de Cambio
// Carga de las 6 tasas (Tu ruta que devuelve 200 OK)
router.get('/rates', authAdmin, RateController.getAllRates); 
// Actualización de las 6 tasas (La ruta que acabamos de crear para solucionar el 404 POST)
router.post('/rates/update-all', authAdmin, RateController.updateAllRates); 

module.exports = router;