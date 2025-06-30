/*const express = require('express');
const router = express.Router();
const pool = require('../db');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

router.post('/', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Correo requerido' });
  }

  try {
    const [user] = await pool.query('SELECT * FROM personal_Client WHERE email = ?', [email]);

    if (user.length === 0) {
      return res.status(404).json({ success: false, message: 'Correo no registrado' });
    }

    const token = crypto.randomBytes(32).toString('hex');

    await pool.query('INSERT INTO password_resets (email, token) VALUES (?, ?)', [email, token]);

    const resetLink = `divisaapp://reset-password?token=${token}`; // Opcionalmente, agrega tu frontend aquí

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"DivisaApp" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Restablece tu contraseña',
      html: `
        <p>Hola,</p>
        <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <a href="${resetLink}">Restablecer contraseña</a>
        <p>Si tú no solicitaste esto, ignora el correo.</p>
      `
    });

    console.log(`📩 Token generado y enviado: ${token}`);

    return res.json({ success: true, message: 'Se ha enviado un correo con instrucciones' });

  } catch (err) {
    console.error('❌ Error en forgot-password:', err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

module.exports = router;*/
const express = require('express');
const router = express.Router();
const pool = require('../db');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

router.post('/', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Correo requerido' });
  }

  try {
    // Verifica si el email está en la base de datos
    const [user] = await pool.query('SELECT * FROM personal_Client WHERE email = ?', [email]);

    if (user.length === 0) {
      return res.status(404).json({ success: false, message: 'Correo no registrado' });
    }

    // Genera token seguro
    const token = crypto.randomBytes(32).toString('hex');

    // Guarda el token en la tabla
    await pool.query('INSERT INTO password_resets (email, token) VALUES (?, ?)', [email, token]);

    // Enlaces para el correo
   const resetLinkWeb = `https://fluffy-salamander-44d47c.netlify.app/reset-password?token=${token}`; // opcional si tienes frontend web
   const resetDeepLink = `https://fluffy-salamander-44d47c.netlify.app/reset-password?token=${token}`;    // enlace hacia Android app

    // Configura el transporte de nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });

    // Enviar correo
    await transporter.sendMail({
      from: `"DivisaApp" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Restablece tu contraseña',
      text: `Hola,\n\nHaz clic en el siguiente enlace para restablecer tu contraseña:\n\n${resetDeepLink}\n\nSi no fuiste tú, ignora este mensaje.`,
      html: `
          <div style="font-family:sans-serif; color:#212121">
    <h2>Hola 👋</h2>
    <p>Recibimos una solicitud para restablecer tu contraseña.</p>
    <p>Puedes hacerlo desde la app:</p>

    <a href="${resetDeepLink}" style="display:inline-block; padding:12px 20px; background:#1565C0; color:white; border-radius:4px; text-decoration:none;">
      Restablecer desde la app
    </a>

    <p>Si el botón no funciona, copia y pega este el token en tu app Android</p>
    <p style="font-size:14px; color:#1565C0;">${resetDeepLink}</p>

    <p style="font-size:13px;color:#666;">Si no solicitaste esto, puedes ignorar este mensaje.</p>
  </div>
      `
    });

    console.log(`📩 Token enviado correctamente para ${email}: ${token}`);

    return res.json({ success: true, message: 'Se ha enviado un correo con instrucciones' });

  } catch (err) {
    console.error('❌ Error en forgot-password:', err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

module.exports = router;