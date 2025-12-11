const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

// 📁 Configuración de almacenamiento de archivos (Sin cambios)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/comprobantes';
    // Asegura que el directorio existe
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `comprobante_${Date.now()}_${Math.floor(Math.random() * 9999)}${ext}`);
  }
});
const upload = multer({ storage });

// 📧 Configuración de transporte para correos (Puerto 465 y secure: true)
const transporter = nodemailer.createTransport({
    // Usamos el host directo de Resend
    host: 'smtp.resend.com', 
    port: process.env.MAIL_PORT || 587,
    secure: false, 
    auth: {
        user: process.env.MAIL_USER, // Leerá 'resend'
        pass: process.env.MAIL_PASS // Leerá la API Key
    },
    name: 'smtp.resend.com', 
    tls: {
        ciphers: 'SSLv3' 
    }
});
// 🧠 Lógica principal para registrar transferencia
const registerTransferHandler = async (req, res) => {
  console.log('🟢 Iniciando registro de transferencia bancaria');

  // 🚨 LOGS DE DEPURACIÓN CRÍTICA (Mantenidos)
  console.log('DEBUG: Contenido de req.body completo:', req.body);
  console.log('DEBUG: Contenido de req.file completo:', req.file);
  
  // Desestructuramos los campos que deben estar en req.body
  const {
    nombre,
    dni,
    cuenta,
    banco,
    email,
    monto,
    cod_aprobacion,
  } = req.body;

  // OBTENER CAMPOS FALTANTES/OPCIONALES DE FORMA SEGURA
  const user_id = req.body.user_id;
  const cupon = req.body.cupon || null;
  const moneda = req.body.moneda || "";

  const comprobante = req.file;
  
  // Log de datos recibidos (Mantenido)
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

  // 🔒 Validación de campos (Mantenida)
  if (!user_id || !nombre || !dni || !cuenta || !banco || !email || !monto || !cod_aprobacion || !comprobante) {
    
    console.error('❌ Faltan campos requeridos. ID de usuario o Comprobante son nulos/vacíos.');
    
    // Limpiar archivo si la validación falla (protegido)
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

    // ... Conversión y validación de user_id (Mantenida)
    const userIdInt = parseInt(user_id, 10);
    if (isNaN(userIdInt) || userIdInt <= 0) { 
      await connection.rollback(); 
      console.error('❌ user_id inválido o negativo:', user_id);
      return res.status(400).json({ success: false, message: 'ID de usuario inválido' });
    }

    // ... Validación y actualización del cupón (Mantenida)
    if (cupon) {
        // ... (Lógica de validación y update del cupón)
        console.log('🔍 Validando y actualizando cupón:', cupon);

        const [cuponRows] = await connection.query(`SELECT * FROM cupones WHERE codigo = ?`, [cupon]);
        const cuponData = cuponRows[0];
        const isInvalid = cuponRows.length === 0 || cuponData.usos_actuales >= cuponData.usos_maximos;

        if (isInvalid) {
            await connection.rollback();
            const msg = (cuponRows.length === 0) ? 'Cupón inválido' : 'Cupón sin usos disponibles';
            console.error(`❌ ${msg}`);
            return res.status(400).json({ success: false, message: msg });
        }

        await connection.query(`UPDATE cupones SET usos_actuales = usos_actuales + 1 WHERE id = ?`, [cuponData.id]);
        console.log('✅ Cupón validado y actualizado');
    }

    // 3. 📝 Insertar transferencia (Consulta de una sola línea, mantenida para evitar error 1064)
    const insertQuery = "INSERT INTO transferencias (user_id, nombre, dni, cuenta, banco, email, monto, cod_aprobacion, comprobante_url, cupon, moneda) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    await connection.query(insertQuery, [
      userIdInt, nombre, dni, cuenta, banco, email, monto, cod_aprobacion, comprobanteUrl, cupon, moneda
    ]);

    // 4. CONFIRMAR LA TRANSFERENCIA (COMMIT)
    await connection.commit();
    console.log('✅ Transferencia registrada y confirmada (COMMIT) en base de datos');

    // 🏆 RESPUESTA AL CLIENTE INMEDIATAMENTE DESPUÉS DEL COMMIT (Resuelve el error 499)
    res.status(201).json({ success: true, message: 'Transferencia registrada con éxito' });


    // ----------------------------------------------------
    // 5. ENVIAR CORREO (RECIBO FORMAL DE ESTADO PENDIENTE)
    // ----------------------------------------------------
    // Se ejecuta de forma asíncrona y no bloquea el hilo principal.
    (async () => {
        const mailOptions = {
          from: process.env.MAIL_USER,
          to: email,
            // 💡 CAMBIO CRÍTICO: Asunto que refleja el estado PENDIENTE
          subject: 'Recibo Oficial: Transferencia Registrada - Estado: PENDIENTE DE VERIFICACIÓN',
          html: `
            <h2>Hola ${nombre},</h2>
            <p>Hemos recibido tu solicitud de transferencia. Los detalles están siendo verificados contra el comprobante adjunto.</p>
            <p style="color: red; font-weight: bold;">El estado actual de tu transferencia es: PENDIENTE DE VERIFICACIÓN.</p>
            <p>Puedes seguir el progreso en la sección "Últimos movimientos" de tu aplicación.</p>
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
            console.log('📧 Correo de notificación enviado (en background):', info.response);
        } catch (mailError) {
            // Este es el error de Connection Timeout que necesitamos diagnosticar
            console.error('❌ Error al enviar correo (fallo de notificación no crítico):', mailError.message || mailError);
        }
    })(); // Se invoca inmediatamente

  } catch (error) {
    // ----------------------------------------------------
    // 6. ROLLBACK Y LIMPIEZA PROTEGIDA (Mantenida)
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
    // Si no se ha enviado la respuesta, envía el 500
    if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Error al registrar transferencia' });
    }
  } finally {
    // 7. LIBERAR CONEXIÓN (Mantenida)
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