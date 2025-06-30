/*const pool = require('../db');
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

// 📧 Transporter usando variables de entorno seguras (configura esto en el .env)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER, // ejemplo: 'danielgastelu.s@gmail.com'
    pass: process.env.MAIL_PASS  // ejemplo: 'cpjtrykuqyfouhxt'
  }
});

// 🧠 Lógica principal para registrar transferencia
const registerTransferHandler = async (req, res) => {
  console.log('🟢 Iniciando registro de transferencia bancaria');

  const { nombre, dni, cuenta, banco, email, monto, cod_aprobacion } = req.body;
  const comprobante = req.file;

  // 🧾 Mostrar qué se recibió
  console.log('📩 Datos recibidos:', {
    nombre, dni, cuenta, banco, email, monto, cod_aprobacion,
    comprobanteRecibido: comprobante ? comprobante.originalname : 'NULO'
  });

  // 🔒 Validación de campos
  if (!nombre || !dni || !cuenta || !banco || !email || !monto || !cod_aprobacion || !comprobante) {
    console.error('❌ Faltan campos requeridos o comprobante');
    return res.status(400).json({
      success: false,
      message: 'Todos los campos y el comprobante son requeridos'
    });
  }

  try {
    let user_id = null;

    // 🔍 Buscar user_id opcionalmente (no obligatorio)
    const [userRows] = await pool.query(`SELECT id FROM users WHERE email = ?`, [email]);
    if (userRows.length > 0) {
      user_id = userRows[0].id;
    }

    const comprobanteUrl = comprobante.path;

    // 📝 Insertar transferencia
    await pool.query(`
      INSERT INTO transferencias (
        user_id, nombre, dni, cuenta, banco, email, monto, cod_aprobacion, comprobante_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [user_id, nombre, dni, cuenta, banco, email, monto, cod_aprobacion, comprobanteUrl]);

    console.log('✅ Transferencia registrada con éxito');

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

    res.status(201).json({ success: true, message: 'Transferencia registrada y correo enviado' });

  } catch (error) {
    console.error('❌ Error al registrar transferencia:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
};

module.exports = {
  uploadComprobante: upload.single('comprobante'),
  registerTransferHandler
};*/
/*
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

// 📧 Transporter para correos
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// 🧠 Lógica principal
const registerTransferHandler = async (req, res) => {
  console.log('🟢 Iniciando registro de transferencia bancaria');

  const { nombre, dni, cuenta, banco, email, monto, cod_aprobacion } = req.body;
  const comprobante = req.file;

  console.log('📩 Datos recibidos:', {
    nombre, dni, cuenta, banco, email, monto, cod_aprobacion,
    comprobanteRecibido: comprobante ? comprobante.originalname : 'NULO'
  });

  if (!nombre || !dni || !cuenta || !banco || !email || !monto || !cod_aprobacion || !comprobante) {
    console.error('❌ Faltan campos requeridos o comprobante');
    return res.status(400).json({
      success: false,
      message: 'Todos los campos y el comprobante son requeridos'
    });
  }

  try {
    let user_id = null;

    // Buscar en 'users' (Google)
    const [googleUsers] = await pool.query(`SELECT id FROM users WHERE email = ?`, [email]);
    if (googleUsers.length > 0) {
      user_id = googleUsers[0].id;
    } else {
      // Buscar en 'personal_Client'
      const [personalUsers] = await pool.query(`SELECT user_id FROM personal_Client WHERE email = ?`, [email]);
      if (personalUsers.length > 0) {
        user_id = personalUsers[0].user_id;
      }
    }

    console.log("📌 user_id determinado:", user_id);

    if (!user_id) {
      return res.status(400).json({ success: false, message: 'Usuario no encontrado en el sistema' });
    }

    const comprobanteUrl = comprobante.path;

    await pool.query(`
      INSERT INTO transferencias (
        user_id, nombre, dni, cuenta, banco, email, monto, cod_aprobacion, comprobante_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [user_id, nombre, dni, cuenta, banco, email, monto, cod_aprobacion, comprobanteUrl]);

    console.log('✅ Transferencia registrada con éxito');

    // ✉️ Correo
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

    res.status(201).json({ success: true, message: 'Transferencia registrada y correo enviado' });

  } catch (error) {
    console.error('❌ Error al registrar transferencia:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
};

module.exports = {
  uploadComprobante: upload.single('comprobante'),
  registerTransferHandler
};*/

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
    cod_aprobacion
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
    // 🧠 Conversión segura del user_id
    const userIdInt = parseInt(user_id, 10);
    if (isNaN(userIdInt)) {
      console.error('❌ user_id inválido recibido:', user_id);
      return res.status(400).json({ success: false, message: 'ID de usuario inválido' });
    }

    console.log('📌 user_id convertido a entero:', userIdInt);

    // 📝 Insertar transferencia
    await pool.query(`
      INSERT INTO transferencias (
        user_id, nombre, dni, cuenta, banco, email, monto, cod_aprobacion, comprobante_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [userIdInt, nombre, dni, cuenta, banco, email, monto, cod_aprobacion, comprobanteUrl]);

    console.log('✅ Transferencia registrada con éxito');

    // ✉️ Enviar correo de confirmación
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

    res.status(201).json({ success: true, message: 'Transferencia registrada y correo enviado' });

  } catch (error) {
    console.error('❌ Error al registrar transferencia:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
};

module.exports = {
  uploadComprobante: upload.single('comprobante'),
  registerTransferHandler
};