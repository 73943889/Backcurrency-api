/*const pool = require('../db');

const registerPersonalClient = async (req, res) => {
  console.log('🟢 Iniciando registro de cliente personal');

  const { name, email, password, dni, phone } = req.body;

  if (!email || !password || !dni || !phone) {
    console.log('🔴 Faltan campos requeridos');
    return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
  }

  const connection = await pool.getConnection(); // 🔒 abrimos una conexión transaccional
  try {
    await connection.beginTransaction();

    const [results] = await connection.query(`
      SELECT email, dni, phone FROM personal_Client
      WHERE email = ? OR dni = ? OR phone = ?
    `, [email, dni, phone]);

    if (results.length > 0) {
      const existing = results[0];
      console.log("🟡 Coincidencia detectada:", existing);

      let message = 'Ya existe un registro con: ';
      if (existing.email === email) message += 'correo ';
      if (existing.dni === dni) message += 'DNI ';
      if (existing.phone === phone) message += 'teléfono ';

      await connection.rollback();
      return res.status(409).json({ success: false, message: message.trim() });
    }

    // 🔁 Paso 1: Insertar en tabla `users`
    const [userResult] = await connection.query(`
      INSERT INTO users (email, password, type, created_at)
      VALUES (?, ?, 'personal', NOW())
    `, [email, password]);

    const userId = userResult.insertId; // 👈 este es el user_id generado

    // 🔁 Paso 2: Insertar en tabla `personal_Client` con user_id
    await connection.query(`
      INSERT INTO personal_Client (user_id, name, email, password, dni, phone, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [userId, name, email, password, dni, phone]);

    await connection.commit();

    console.log('✅ Cliente personal y usuario creados con éxito');
    res.status(201).json({ success: true, message: 'Cliente registrado exitosamente' });

  } catch (err) {
    await connection.rollback();
    console.error('❌ Error en el servidor:', err);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  } finally {
    connection.release();
  }
};

module.exports = registerPersonalClient;*/

const pool = require('../db');

const registerPersonalClient = async (req, res) => {
  console.log('🟢 Iniciando registro de cliente personal');

  const { name, email, password, dni, phone } = req.body;

  // Validación de campos requeridos
  if (!email || !password || !dni || !phone) {
    console.log('🔴 Faltan campos requeridos');
    return res.status(400).json({
      success: false,
      message: 'Todos los campos son requeridos'
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // ✅ Verificar si ya existe el correo en tabla `users`
    const [userExist] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (userExist.length > 0) {
      console.log('🟡 Correo ya registrado en tabla users');
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'El correo ya está registrado'
      });
    }

    // ✅ Verificar duplicados en tabla personal_Client
    const [results] = await connection.query(`
      SELECT email, dni, phone FROM personal_Client
      WHERE dni = ? OR phone = ?
    `, [dni, phone]);

    if (results.length > 0) {
      const existing = results[0];
      console.log("🟡 Coincidencia detectada en personal_Client:", existing);

      let message = 'Ya existe un registro con: ';
      if (existing.dni === dni) message += 'DNI ';
      if (existing.phone === phone) message += 'teléfono ';

      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: message.trim()
      });
    }

    // Paso 1: Insertar en tabla `users`
    const [userResult] = await connection.query(`
      INSERT INTO users (email, password, type, created_at)
      VALUES (?, ?, 'personal', NOW())
    `, [email, password]);

    const userId = userResult.insertId;

    // Paso 2: Insertar en `personal_Client`
    await connection.query(`
      INSERT INTO personal_Client (user_id, name, email, password, dni, phone, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [userId, name, email, password, dni, phone]);

    await connection.commit();

    console.log('✅ Cliente personal y usuario creados con éxito');
    res.status(201).json({
      success: true,
      message: 'Cliente registrado exitosamente',
      user_id: userId
    });

  } catch (err) {
    await connection.rollback();
    console.error('❌ Error en el servidor:', err);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  } finally {
    connection.release();
  }
};

module.exports = registerPersonalClient;