const express = require('express');
const router = express.Router();
const path = require('path');
const generateToken = require(path.join(__dirname, '../POST/generateToken'));
router.post('/login', generateToken);

module.exports = router;