// src/routes/adminRoutes.js

const express = require('express');
const router = express.Router();

const adminLoginHandler = require('../POST/adminLogin');
const updateStatusHandler = require('../POST/updateTransfer');
const getAllTransfersHandler = require('../GET/getAllTransfer'); 
const authAdmin = require('../middleware/authAdmin'); // <-- Usaremos este nombre
const RateController = require('../POST/AddNewRate');
const CouponController = require('../GET/getCoupon');

// 1. Ruta pública para obtener el Token (No necesita protección)
router.post('/login', adminLoginHandler);

// Gestión de Transferencias
router.get('/transfers/all', authAdmin, getAllTransfersHandler);
router.post('/transfer/update', authAdmin, updateStatusHandler); 

// Gestión de Tasas de Cambio
router.get('/rates', authAdmin, RateController.getAllRates); 
router.post('/rates/update-all', authAdmin, RateController.updateAllRates); 

// 🚀 GESTIÓN DE CUPONES (NUEVAS RUTAS)
router.get('/coupons', authAdmin, CouponController.getAllCoupons);
router.post('/coupon/create', authAdmin, CouponController.createCoupon);

// 🚀 GESTIÓN DE CONFIGURACIÓN MAESTRA DE CUPONES (NUEVAS RUTAS)
router.get('/coupon-config', authAdmin, CouponController.getCouponConfig);
router.post('/coupon-config/update', authAdmin, CouponController.updateCouponConfig);

module.exports = router;