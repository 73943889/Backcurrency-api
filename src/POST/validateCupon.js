const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/cupones/validar
router.post('/validar', async (req, res) => {
  const { user_id, cupon } = req.body;

  if (!user_id || !cupon) {
    return res.status(400).json({ success: false, message: 'Faltan datos requeridos' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM cupones WHERE codigo = ? LIMIT 1',
      [cupon]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Cupón no encontrado' });
    }

    const cuponData = rows[0];
    const hoy = new Date();
    const expira = new Date(cuponData.fecha_expiracion);

    if (hoy > expira) {
      return res.status(400).json({ success: false, message: 'Cupón vencido' });
    }

    if (cuponData.usos_actuales >= cuponData.usos_maximos) {
      return res.status(400).json({ success: false, message: 'Este cupón ya fue usado el máximo de veces' });
    }

    return res.json({
      success: true,
      descuento: parseFloat(cuponData.descuento),
      cupon: cuponData.codigo
    });

  } catch (err) {
    console.error('❌ Error al validar cupón:', err);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

module.exports = router;