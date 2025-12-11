const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

// 📁 Configuración de almacenamiento de archivos (Mantenida)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/comprobantes';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    // Evita errores con Date.now si el tiempo es muy similar
    cb(null, `comprobante_${Date.now()}_${Math.floor(Math.random() * 9999)}${ext}`);
  }
});
const upload = multer({ storage });

// 📧 Configuración de transporte para correos (CORREGIDA para SMTP Host/Port)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // Usar host explícito
  port: 587,              // Puerto estándar para STARTTLS
  secure: false,          // Falso para port 587, usa STARTTLS
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS // 🛑 DEBE SER CONTRASEÑA DE APLICACIÓN DE GOOGLE
  },
  tls: {
    // Esto es útil si Railway tiene problemas con la cadena de certificados
    rejectUnauthorized: false
  }
});

// 🧠 Lógica principal para registrar transferencia
const registerTransferHandler = async (req, res) => {
  console.log('🟢 Iniciando registro de transferencia bancaria');
console.log('DEBUG: Contenido de req.body completo:', req.body);
console.log('DEBUG: Contenido de req.file completo:', req.file);
  const {
    user_id,
    nombre,
    dni,
    cuenta,
    banco,
    email,
    monto,
    cod_aprobacion,
    cupon,
    moneda
  } = req.body;
  const comprobante = req.file;
  
  // Agregando el nombre de archivo seguro al log
  const comprobanteNombre = comprobante ? path.basename(comprobante.path) : 'NULO';

  console.log('📩 Datos recibidos:', {
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
    // Si cupon o moneda son "", pasan la validación de arriba, lo cual es correcto.
    
    // **Añadir una verificación explícita para user_id si es que llega como cadena 'undefined'**
    if (user_id === 'undefined') {
        console.error('❌ user_id llegó como cadena "undefined". Revisar RequestBody en Kotlin.');
    }

    // 💡 Aquí su log de error original:
    console.error('❌ Faltan campos requeridos o comprobante');
    // ... (limpieza y respuesta de error)
    return res.status(400).json({
      success: false,
      message: 'Todos los campos y el comprobante son requeridos'
    });
}

  const comprobanteUrl = comprobante.path;
  let connection; // Para gestionar la conexión y transacción

  try {
    // ----------------------------------------------------
    // 1. INICIAR TRANSACCIÓN (Para atomicidad Cupón + Transferencia)
    // ----------------------------------------------------
    connection = await pool.getConnection(); 
    await connection.beginTransaction(); 
    console.log('✅ Transacción iniciada');


    // ✅ Conversión segura de user_id
    const userIdInt = parseInt(user_id, 10);
    if (isNaN(userIdInt)) {
      await connection.rollback(); 
      console.error('❌ user_id inválido:', user_id);
      return res.status(400).json({ success: false, message: 'ID de usuario inválido' });
    }

    // 2. Validación y actualización del cupón (si se envió)
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

    // 3. 📝 Insertar transferencia (CÓDIGO SQL LIMPIO)
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
      cupon || null,
      moneda
    ]);

    // 4. CONFIRMAR LA TRANSFERENCIA (COMMIT)
    await connection.commit();
    console.log('✅ Transferencia registrada y confirmada (COMMIT) en base de datos');


    // ----------------------------------------------------
    // 5. ENVIAR CORREO
    // ----------------------------------------------------
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: 'Transferencia registrada correctamente',
      html: `
        <h2>Hola ${nombre},</h2>
        <p>Tu transferencia ha sido registrada y está siendo procesada:</p>
        <ul>
          <li><strong>Monto:</strong> ${moneda} ${monto}</li>
          <li><strong>Código de aprobación:</strong> ${cod_aprobacion}</li>
          ${cupon ? `<li><strong>Cupón aplicado:</strong> ${cupon}</li>` : ''}
        </ul>
      `,
      attachments: [
        {
          filename: comprobante.originalname,
          path: comprobante.path
        }
      ]
    };
    
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
    // 6. ROLLBACK Y LIMPIEZA
    // ----------------------------------------------------
    if (connection) {
      await connection.rollback(); 
      console.log('❌ Se ejecutó ROLLBACK debido a un error interno o de BD.');
    }
    // Limpiar el archivo subido si la BD falló
    if (comprobante && fs.existsSync(comprobante.path)) {
      fs.unlinkSync(comprobante.path);
    }

    console.error('❌ Error interno:', error);
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

module.exports = {
  uploadComprobante: upload.single('comprobante'),
  registerTransferHandler
};