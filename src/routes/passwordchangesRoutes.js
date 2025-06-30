const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: 'Token y nueva contraseña requeridos' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT email FROM password_resets WHERE token = ? ORDER BY created_at DESC LIMIT 1',
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Token inválido o expirado' });
    }

    const email = rows[0].email;

    const [clientRows] = await pool.query(
      'SELECT user_id FROM personal_Client WHERE email = ?',
      [email]
    );

    if (clientRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const user_id = clientRows[0].user_id;

    await pool.query(
      'UPDATE personal_Client SET password = ? WHERE email = ?',
      [newPassword, email]
    );

    await pool.query(`
      INSERT INTO password_changes (user_id, email, change_type, ip_address)
      VALUES (?, ?, 'forgot', ?)
    `, [user_id, email, req.ip]);

    await pool.query('DELETE FROM password_resets WHERE token = ?', [token]);

    return res.json({ success: true, message: 'Contraseña actualizada correctamente' });

  } catch (err) {
    console.error('❌ Error en reset-password:', err);
    return res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

module.exports = router;