const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/ping-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT NOW() AS now');
    res.json({ success: true, message: 'Conexión exitosa a la base de datos 🎉', serverTime: rows[0].now });
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error.message);
    res.status(500).json({ success: false, message: 'No se pudo conectar a la base de datos', error: error.message });
  }
});

module.exports = router;