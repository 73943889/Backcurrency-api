// src/POST/login_personal_client.js

/*const pool = require('../db');

const loginPersonalClient = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Correo y contraseña son requeridos' });
  }
  try {
    const [results] = await pool.query(`
      SELECT * FROM personal_Client WHERE email = ? AND password = ?
    `, [email, password]);

    if (results.length > 0) {
      return res.status(200).json({ success: true, user: results[0] });
    } else {
      return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos' });
    }
  } catch (err) {
    console.error('❌ Error en el login:', err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};
module.exports = loginPersonalClient;*/

const pool = require('../db');

const loginPersonalClient = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Correo y contraseña son requeridos' });
  }

  try {
    const [results] = await pool.query(`
      SELECT 
        pc.id,           -- ID de la tabla personal_Client
        pc.user_id,      -- ID real en la tabla users
        pc.name,
        pc.email,
        pc.password,
        pc.dni,
        pc.phone,
        pc.created_at
      FROM personal_Client pc
      INNER JOIN users u ON pc.user_id = u.id
      WHERE pc.email = ? AND pc.password = ?
    `, [email, password]);

    if (results.length > 0) {
      return res.status(200).json({ success: true, user: results[0] });
    } else {
      return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos' });
    }
  } catch (err) {
    console.error('❌ Error en el login:', err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

module.exports = loginPersonalClient;