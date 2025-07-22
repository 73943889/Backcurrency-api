const pool = require('../db');
const generarCuponAleatorio = require('../utils/generatedCupon'); // debe existir este archivo

const registerPersonalClient = async (req, res) => {
  console.log('🟢 Iniciando registro de cliente personal');

  const { name, email, password, dni, phone } = req.body;

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

    // Verificar si el correo ya existe
    const [userExist] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (userExist.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'El correo ya está registrado'
      });
    }

    // Verificar duplicados en personal_Client
    const [results] = await connection.query(`
      SELECT email, dni, phone FROM personal_Client
      WHERE dni = ? OR phone = ?
    `, [dni, phone]);

    if (results.length > 0) {
      const existing = results[0];
      let message = 'Ya existe un registro con: ';
      if (existing.dni === dni) message += 'DNI ';
      if (existing.phone === phone) message += 'teléfono ';

      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: message.trim()
      });
    }

    // Insertar en tabla users
    const [userResult] = await connection.query(`
      INSERT INTO users (email, password, type, created_at)
      VALUES (?, ?, 'personal', NOW())
    `, [email, password]);

    const userId = userResult.insertId;

    // Insertar en personal_Client
    await connection.query(`
      INSERT INTO personal_Client (user_id, name, email, password, dni, phone, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [userId, name, email, password, dni, phone]);

    // 🔁 Buscar promoción activa
    const [promos] = await connection.query(
      `SELECT * FROM config_cupones WHERE activa = TRUE LIMIT 1`
    );

    let codigoCupon = null;

    if (promos.length > 0) {
      const promo = promos[0];
      codigoCupon = generarCuponAleatorio();
      let expiracion = null;

      if (promo.tipo_expiracion === 'tiempo' || promo.tipo_expiracion === 'ambos') {
        expiracion = new Date();
        switch (promo.duracion_unidad) {
          case 'minuto':
            expiracion.setMinutes(expiracion.getMinutes() + promo.duracion_valor);
            break;
          case 'hora':
            expiracion.setHours(expiracion.getHours() + promo.duracion_valor);
            break;
          case 'dia':
            expiracion.setDate(expiracion.getDate() + promo.duracion_valor);
            break;
          case 'semana':
            expiracion.setDate(expiracion.getDate() + promo.duracion_valor * 7);
            break;
          case 'mes':
            expiracion.setMonth(expiracion.getMonth() + promo.duracion_valor);
            break;
        }
      }

      await connection.query(`
        INSERT INTO cupones (
          user_id, codigo, descuento, expiracion, usos_maximos, tipo_expiracion
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        userId,
        codigoCupon,
        promo.descuento,
        expiracion,
        promo.usos_maximos,
        promo.tipo_expiracion
      ]);

      console.log('🎁 Cupón generado para el nuevo usuario:', codigoCupon);
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Cliente registrado exitosamente',
      user_id: userId,
      cupon: codigoCupon
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