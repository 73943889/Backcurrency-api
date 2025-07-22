const express = require('express');
const router = express.Router();
const getCouponValidity = require('../GET/getCouponValidity');
router.get('/vigencia/:userId', getCouponValidity);
module.exports = router;