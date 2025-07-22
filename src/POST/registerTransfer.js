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
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage });

// 📧 Configurar transporte para correos
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// 🧠 Lógica principal para registrar transferencia
const registerTransferHandler = async (req, res) => {
  console.log('🟢 Iniciando registro de transferencia bancaria');

  const {
    user_id,
    nombre,
    dni,
    cuenta,
    banco,
    email,
    monto,
    cod_aprobacion,
    cupon ,
	moneda
  } = req.body;
  const comprobante = req.file;

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
    comprobanteRecibido: comprobante ? comprobante.originalname : 'NULO'
  });

  // 🔒 Validación de campos
  if (!user_id || !nombre || !dni || !cuenta || !banco || !email || !monto || !cod_aprobacion || !comprobante) {
    console.error('❌ Faltan campos requeridos o comprobante');
    return res.status(400).json({
      success: false,
      message: 'Todos los campos y el comprobante son requeridos'
    });
  }

  const comprobanteUrl = comprobante.path;

  try {
    // ✅ Conversión segura de user_id
    const userIdInt = parseInt(user_id, 10);
    if (isNaN(userIdInt)) {
      console.error('❌ user_id inválido:', user_id);
      return res.status(400).json({ success: false, message: 'ID de usuario inválido' });
    }

    // 🧪 Validación y actualización del cupón (si se envió)
    if (cupon) {
      console.log('🔍 Validando cupón:', cupon);

      const [cuponRows] = await pool.query(
        `SELECT * FROM cupones WHERE codigo = ?`,
        [cupon]
      );

      if (cuponRows.length === 0) {
        console.error('❌ Cupón no encontrado');
        return res.status(400).json({ success: false, message: 'Cupón inválido' });
      }

      const cuponData = cuponRows[0];

      if (cuponData.usos_actuales >= cuponData.usos_maximos) {
        console.error('❌ Cupón sin usos disponibles');
        return res.status(400).json({ success: false, message: 'Cupón sin usos disponibles' });
      }

      // ✅ Actualizar uso (+1)
      await pool.query(
        `UPDATE cupones SET usos_actuales = usos_actuales + 1 WHERE id = ?`,
        [cuponData.id]
      );

      console.log('✅ Cupón validado y actualizado');
    }

    // 📝 Insertar transferencia (incluyendo cupon si existe)
    await pool.query(`
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

    console.log('✅ Transferencia registrada en base de datos');

    // ✉️ Enviar correo
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: 'Transferencia registrada correctamente',
      html: `
        <h2>Hola ${nombre},</h2>
        <p>Tu transferencia ha sido registrada con los siguientes datos:</p>
        <ul>
          <li><strong>DNI:</strong> ${dni}</li>
          <li><strong>Cuenta:</strong> ${cuenta}</li>
          <li><strong>Banco:</strong> ${banco}</li>
          <li><strong>Monto:</strong> ${monto}</li>
          <li><strong>Código de aprobación:</strong> ${cod_aprobacion}</li>
          ${cupon ? `<li><strong>Cupón aplicado:</strong> ${cupon}</li>` : ''}
        </ul>
        <p>Gracias por usar nuestra aplicación.</p>
      `,
      attachments: [
        {
          filename: comprobante.originalname,
          path: comprobante.path
        }
      ]
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ Error al enviar correo:', error);
      } else {
        console.log('📧 Correo enviado correctamente:', info.response);
      }
    });

    res.status(201).json({ success: true, message: 'Transferencia registrada con éxito' });

  } catch (error) {
    console.error('❌ Error interno:', error);
    res.status(500).json({ success: false, message: 'Error al registrar transferencia' });
  }
};

module.exports = {
  uploadComprobante: upload.single('comprobante'),
  registerTransferHandler
};