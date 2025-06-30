// src/POST/login_personal_client.js

const pool = require('../db');

const loginUserGoogle = async (req, res) => {
  try {
    const { name, email, uid } = req.body;

    console.log('📥 Solicitud de login con Google recibida');
    console.log('➡️ Datos recibidos:', { name, email, uid });

    if (!email || !uid) {
      console.warn('⚠️ Datos incompletos en la solicitud');
      return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
    }

    // 🔍 Buscar usuario por EMAIL
    const [existingUsers] = await pool.query(`SELECT * FROM google_users WHERE email = ?`, [email]);

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];

      // 🔁 Si el UID es distinto, actualizarlo primero
      if (existingUser.uid !== uid) {
        await pool.query(`UPDATE google_users SET uid = ? WHERE email = ?`, [uid, email]);
        console.log('🔁 UID actualizado para el usuario existente');
      }
    }

    // ✅ Luego de asegurarte que el UID esté actualizado, validar por email y uid
    console.log('🔍 Verificando usuario por email y uid...');
    const [results] = await pool.query(`
      SELECT * FROM google_users WHERE email = ? AND uid = ?
    `, [email, uid]);

    if (results.length > 0) {
      console.log('✅ Usuario encontrado y válido, iniciando sesión');
      return res.status(200).json({ success: true, user: results[0] });
    }

    // ❌ No encontrado
    console.log('🆕 Usuario no registrado, se debe crear uno nuevo');
    return res.status(404).json({ success: false, message: 'Usuario no registrado con Google' });

  } catch (err) {
    console.error('❌ Error en loginUserGoogle:', err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

module.exports = loginUserGoogle;