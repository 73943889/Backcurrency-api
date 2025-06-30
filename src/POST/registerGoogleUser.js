/*const pool = require('../db');

const registerGoogleUser = async (req, res) => {
  const { name, email, uid } = req.body;

  if (!name || !email || !uid) {
    return res.status(400).json({ success: false, message: 'Faltan datos' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Verificar si ya existe por UID
    const [existing] = await connection.query(
      'SELECT * FROM google_users WHERE uid = ?',
      [uid]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(200).json({ success: true, message: 'Ya registrado' });
    }

    // Paso 1: Insertar en tabla `users`
    const [userResult] = await connection.query(
      'INSERT INTO users (email, password, type, created_at) VALUES (?, NULL, "google", NOW())',
      [email]
    );
    const userId = userResult.insertId;

    // Paso 2: Insertar en tabla `google_users` con user_id
    await connection.query(
      'INSERT INTO google_users (user_id, name, email, uid, created_at) VALUES (?, ?, ?, ?, NOW())',
      [userId, name, email, uid]
    );

    await connection.commit();

    return res.status(201).json({ success: true, message: 'Registrado con éxito' });
  } catch (err) {
    await connection.rollback();
    console.error('❌ Error en el servidor:', err);
    return res.status(500).json({ success: false, message: 'Error del servidor' });
  } finally {
    connection.release();
  }
};

module.exports = registerGoogleUser;*/

const pool = require('../db');

const registerGoogleUser = async (req, res) => {
  const { name, email, uid } = req.body;

  if (!name || !email || !uid) {
    return res.status(400).json({ success: false, message: 'Faltan datos' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Verificar si ya existe por UID
    const [existing] = await connection.query(
      'SELECT gu.user_id, gu.name, gu.email FROM google_users gu WHERE gu.uid = ?',
      [uid]
    );

    if (existing.length > 0) {
      const user = existing[0];
      await connection.rollback();
      return res.status(200).json({
        success: true,
        message: 'Ya registrado',
        id: user.user_id,
        name: user.name,
        email: user.email
      });
    }

    // Paso 1: Insertar en tabla `users`
    const [userResult] = await connection.query(
      'INSERT INTO users (email, password, type, created_at) VALUES (?, NULL, "google", NOW())',
      [email]
    );
    const userId = userResult.insertId;

    // Paso 2: Insertar en tabla `google_users`
    await connection.query(
      'INSERT INTO google_users (user_id, name, email, uid, created_at) VALUES (?, ?, ?, ?, NOW())',
      [userId, name, email, uid]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Registrado con éxito',
      id: userId,
      name,
      email
    });
  } catch (err) {
    await connection.rollback();
    console.error('❌ Error en el servidor:', err);
    return res.status(500).json({ success: false, message: 'Error del servidor' });
  } finally {
    connection.release();
  }
};

module.exports = registerGoogleUser;