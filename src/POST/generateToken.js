const jwt = require('jsonwebtoken');
const pool = require('../db');

const SECRET_KEY = process.env.JWT_SECRET || 'mi_clave_secreta';

const generateToken = async (req, res) => {
  console.log('📩 Petición recibida:', req.body);

  const { email, password } = req.body;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: '1h' });

    await pool.query(
      'INSERT INTO api_keys (key_value, user_email) VALUES (?, ?)',
      [token, email]
    );

    res.status(200).json({ token });

  } catch (err) {
    console.error('❌ Error al generar token:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = generateToken;