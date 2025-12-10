// src/POST/login_user_google.js

const jwt = require('jsonwebtoken'); 
const pool = require('../db'); 
const JWT_SECRET = process.env.JWT_SECRET || 'TU_SECRETO_JWT_SUPER_SEGURO'; // ⚠️ Asegúrate de que .env esté cargado

const loginUserGoogle = async (req, res) => {
  try {
    const { name, email, uid } = req.body;

    // 🔍 ... (Tu código de búsqueda y verificación de UID aquí)
    // 🔍 ... (Tu código de búsqueda y verificación de UID aquí)
    const [existingUsers] = await pool.query(`SELECT * FROM google_users WHERE email = ?`, [email]);
    if (existingUsers.length > 0 && existingUsers[0].uid !== uid) {
        await pool.query(`UPDATE google_users SET uid = ? WHERE email = ?`, [uid, email]);
    }

    const [results] = await pool.query(`
        SELECT * FROM google_users WHERE email = ? AND uid = ?
    `, [email, uid]);
    // -----------------------------------------------------------

    if (results.length > 0) {
      const userFromDb = results[0]; 
      
      // 🎯 PASO 1: Generar el Token JWT
      const token = jwt.sign(
          { id: userFromDb.id, email: userFromDb.email, loginMethod: 'google' },
          JWT_SECRET,
          { expiresIn: '7d' } 
      );

      // 🎯 PASO 2: Guardar el token en tu tabla api_keys
      try {
          // Insertamos el token recién generado. Ya que es único, si el usuario se loguea 
          // de nuevo, se generará uno diferente y se insertará sin problemas.
          await pool.query(
              'INSERT INTO api_keys (key_value, user_email) VALUES (?, ?)',
              [token, email]
          );
      } catch (dbErr) {
          console.warn('⚠️ Advertencia: Error al insertar token en api_keys. Puede ser clave duplicada antigua, pero continuaremos con el login.', dbErr.message);
          // Nota: A menudo, si el INSERT falla aquí (ej. token duplicado, aunque improbable), 
          // el login puede continuar, ya que el token actual es el que se enviará al cliente.
      }


      // 🎯 PASO 3: Adjuntar el token al objeto de respuesta
      const userResponse = {
          id: userFromDb.id,
          email: userFromDb.email,
          uid: userFromDb.uid,
          // Asegúrate de incluir todos los campos que tu DTO de Android espera:
          name: userFromDb.name,  
          token: token, // ¡TOKEN ADJUNTADO!
      };

      console.log('✅ Usuario encontrado y válido, iniciando sesión. Token generado y guardado.');
      return res.status(200).json({ success: true, user: userResponse }); 
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