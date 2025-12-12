// src/GET/getCoupon.js
// Asume que tienes un archivo db.js o una función de conexión a la base de datos.
const db = require('../db'); // Cambia esto según tu estructura de DB

/**
 * Obtiene todos los cupones de la base de datos para el panel de administración.
 * @route GET /api/admin/coupons
 */
exports.getAllCoupons = async (req, res) => {
    try {
        const sql = `SELECT id, user_id, codigo, descuento, expiracion, usos_maximos, usos_actuales, usado, creado_en 
                     FROM cupones ORDER BY creado_en DESC`;
        
        const [coupons] = await db.execute(sql);

        return res.json({
            success: true,
            coupons: coupons
        });

    } catch (error) {
        console.error("❌ Error al obtener cupones:", error.message);
        return res.status(500).json({
            success: false,
            message: "Error interno al obtener la lista de cupones."
        });
    }
};

/**
 * Crea un cupón nuevo en la base de datos.
 * @route POST /api/admin/coupon/create
 */
exports.createCoupon = async (req, res) => {
    try {
        const { 
            user_id, 
            codigo, 
            descuento, 
            expiracion, 
            usos_maximos, 
            tipo_expiracion // 'tiempo', 'uso' o null
        } = req.body;

        if (!codigo || descuento === undefined) {
            return res.status(400).json({ success: false, message: "Código y Descuento son obligatorios." });
        }
        
        // 1. Validar unicidad del código (opcional, pero buena práctica)
        const [existing] = await db.execute('SELECT id FROM cupones WHERE codigo = ?', [codigo]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: "El código de cupón ya existe." });
        }

        // 2. Construir la consulta SQL
        const sql = `INSERT INTO cupones (user_id, codigo, descuento, expiracion, usos_maximos, tipo_expiracion) 
                     VALUES (?, ?, ?, ?, ?, ?)`;
        
        const values = [
            user_id || null, // Si es null o vacío, inserta NULL
            codigo,
            descuento,
            expiracion || null,
            usos_maximos || null,
            tipo_expiracion || null
        ];

        // 3. Ejecutar la inserción
        const [result] = await db.execute(sql, values);

        return res.status(201).json({
            success: true,
            message: "Cupón creado con éxito.",
            couponId: result.insertId
        });

    } catch (error) {
        console.error("❌ Error al crear cupón:", error);
        // Error de SQL (ej. violación de FOREIGN KEY o tipo de dato)
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor al crear el cupón."
        });
    }
};