const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

// 📁 Configuración de almacenamiento de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/comprobantes';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `comprobante_${Date.now()}_${Math.floor(Math.random() * 9999)}${ext}`);
  }
});
const upload = multer({ storage });

// 📧 Configuración de transporte para correos
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// 🧠 Lógica principal para registrar transferencia
const registerTransferHandler = async (req, res) => {
  console.log('🟢 Iniciando registro de transferencia bancaria');

  // 🚨 LOGS DE DEPURACIÓN CRÍTICA
  console.log('DEBUG: Contenido de req.body completo:', req.body);
  console.log('DEBUG: Contenido de req.file completo:', req.file);
  
  // Desestructuramos solo los campos que sabemos que llegan, y obtenemos los opcionales/críticos de forma segura
  const {
    nombre,
    dni,
    cuenta,
    banco,
    email,
    monto,
    cod_aprobacion,
  } = req.body;

  // 💡 OBTENER CAMPOS FALTANTES DE FORMA SEGURA (Si Kotlin los omite, serán 'undefined', se setean a "" o null)
  const user_id = req.body.user_id;
  const cupon = req.body.cupon || null; // Usamos null para la BD si está vacío
  const moneda = req.body.moneda || "";

  const comprobante = req.file;
  
  // Agregando el nombre de archivo seguro al log
  const comprobanteNombre = comprobante ? path.basename(comprobante.path) : 'NULO';

  console.log('📩 Datos recibidos (Procesados):', {
    user_id,
    nombre,
    dni,
    cuenta,
    banco,
    email,
    monto,
    cod_aprobacion,
    cupon,
    moneda,
    comprobanteRecibido: comprobanteNombre
  });

  // 🔒 Validación de campos
  if (!user_id || !nombre || !dni || !cuenta || !banco || !email || !monto || !cod_aprobacion || !comprobante) {
    
    console.error('❌ Faltan campos requeridos. ID de usuario o Comprobante son nulos/vacíos.');
    // Limpiar archivo si la validación falla (protegido con try/catch)
    if (comprobante && comprobante.path) {
        try {
            fs.unlinkSync(comprobante.path);
            console.log(`🗑️ Archivo temporal eliminado tras fallo de validación.`);
        } catch (cleanupError) {
            console.error('⚠️ Advertencia: Fallo al eliminar el archivo temporal.', cleanupError.message);
        }
    }

    return res.status(400).json({
      success: false,
      message: 'Todos los campos (incluyendo ID de usuario y comprobante) son requeridos'
    });
  }

  const comprobanteUrl = comprobante.path;
  let connection;

  try {
    // ----------------------------------------------------
    // 1. INICIAR TRANSACCIÓN
    // ----------------------------------------------------
    connection = await pool.getConnection(); 
    await connection.beginTransaction(); 
    console.log('✅ Transacción iniciada');


    // ✅ Conversión segura de user_id
    const userIdInt = parseInt(user_id, 10);
    if (isNaN(userIdInt) || userIdInt <= 0) { // Mayor validación para IDs negativos
      await connection.rollback(); 
      console.error('❌ user_id inválido o negativo:', user_id);
      return res.status(400).json({ success: false, message: 'ID de usuario inválido' });
    }

    // 2. Validación y actualización del cupón
    if (cupon) {
      console.log('🔍 Validando y actualizando cupón:', cupon);

      const [cuponRows] = await connection.query(
        `SELECT * FROM cupones WHERE codigo = ?`,
        [cupon]
      );
      
      const cuponData = cuponRows[0];
      const isInvalid = cuponRows.length === 0 || cuponData.usos_actuales >= cuponData.usos_maximos;

      if (isInvalid) {
        await connection.rollback();
        const msg = (cuponRows.length === 0) ? 'Cupón inválido' : 'Cupón sin usos disponibles';
        console.error(`❌ ${msg}`);
        return res.status(400).json({ success: false, message: msg });
      }

      // ✅ Actualizar uso (+1)
      await connection.query(
        `UPDATE cupones SET usos_actuales = usos_actuales + 1 WHERE id = ?`,
        [cuponData.id]
      );

      console.log('✅ Cupón validado y actualizado');
    }

    // 3. 📝 Insertar transferencia
    await connection.query(`
      INSERT INTO transferencias (
        user_id, nombre, dni, cuenta, banco, email, monto, cod_aprobacion, comprobante_url, cupon, moneda
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userIdInt,
      nombre,
      dni,
      cuenta,
      banco,
      email,
      monto,
      cod_aprobacion,
      comprobanteUrl,
      cupon, // Puede ser null
      moneda
    ]);

    // 4. CONFIRMAR LA TRANSFERENCIA (COMMIT)
    await connection.commit();
    console.log('✅ Transferencia registrada y confirmada (COMMIT) en base de datos');


    // ----------------------------------------------------
    // 5. ENVIAR CORREO (Lógica mantenida)
    // ----------------------------------------------------
    // ... (lógica de envío de correo aquí)
    const mailOptions = { /* ... */ };
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Correo enviado correctamente:', info.response);
    } catch (mailError) {
        console.error('❌ Error al enviar correo (fallo de notificación):', mailError.message || mailError);
    }
    // ----------------------------------------------------

    res.status(201).json({ success: true, message: 'Transferencia registrada con éxito' });

  } catch (error) {
    // ----------------------------------------------------
    // 6. ROLLBACK Y LIMPIEZA PROTEGIDA
    // ----------------------------------------------------
    if (connection) {
      await connection.rollback(); 
      console.log('❌ Se ejecutó ROLLBACK debido a un error interno o de BD.');
    }
    
    // Limpiar el archivo subido si la BD falló (PROTEGIDO)
    if (comprobante && comprobante.path) {
        try {
            fs.unlinkSync(comprobante.path);
            console.log(`🗑️ Archivo temporal eliminado.`);
        } catch (cleanupError) {
            console.error('⚠️ Advertencia: Fallo al eliminar el archivo temporal. Ignorando error.', cleanupError.message);
        }
    }

    console.error('❌ ERROR CRÍTICO EN PROCESAMIENTO:', error);
    res.status(500).json({ success: false, message: 'Error al registrar transferencia' });
  } finally {
    // 7. LIBERAR CONEXIÓN
    if (connection) {
        connection.release(); 
        console.log('✅ Conexión a BD liberada.');
    }
  }
};

module.exports = {
  uploadComprobante: upload.single('comprobante'),
  registerTransferHandler
};