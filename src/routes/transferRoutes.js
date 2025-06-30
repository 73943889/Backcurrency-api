const express = require('express');
const router = express.Router();
const { uploadComprobante, registerTransferHandler } = require('../POST/registerTransfer');

router.post('/', uploadComprobante, registerTransferHandler);

module.exports = router;