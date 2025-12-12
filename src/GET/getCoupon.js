// src/controllers/CouponController.js
// Asume que tienes un archivo db.js o una función de conexión a la base de datos.
const db = require('../db'); 

// =========================================================
// A) GESTIÓN DE INSTANCIAS DE CUPONES (Tabla: cupones)
// =========================================================

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
 * Crea un cupón nuevo en la base de datos (Instancia manual o específica).
 * Incluye logging detallado para errores de BD (ej. Foreign Key).
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
            tipo_expiracion 
        } = req.body;

        if (!codigo || descuento === undefined) {
            return res.status(400).json({ success: false, message: "Código y Descuento son obligatorios." });
        }
        
        // Validar unicidad del código (Error de negocio 409)
        const [existing] = await db.execute('SELECT id FROM cupones WHERE codigo = ?', [codigo]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: "El código de cupón ya existe." });
        }
        
        // Manejo de NULLs
        const finalUserId = (user_id && user_id > 0) ? user_id : null; 
        const finalExpiracion = expiracion || null;
        const finalUsosMaximos = usos_maximos || null;
        const finalTipoExpiracion = tipo_expiracion || 'manual';

        const sql = `INSERT INTO cupones (user_id, codigo, descuento, expiracion, usos_maximos, tipo_expiracion) 
                     VALUES (?, ?, ?, ?, ?, ?)`;
        
        const values = [
            finalUserId, 
            codigo,
            descuento,
            finalExpiracion,
            finalUsosMaximos,
            finalTipoExpiracion
        ];

        const [result] = await db.execute(sql, values);

        return res.status(201).json({
            success: true,
            message: "Cupón creado con éxito.",
            couponId: result.insertId
        });

    } catch (error) {
        console.error("❌ Error al crear cupón:", error);
        
        let errorMessage = "Error interno del servidor al crear el cupón.";
        if (error.sqlMessage) {
             errorMessage = `Error de Base de Datos: ${error.sqlMessage}. Revise si el ID de usuario existe.`;
        }

        // Devolvemos el error de BD detallado
        return res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
};


// =========================================================
// B) GESTIÓN DE CONFIGURACIÓN MAESTRA (Tabla: config_cupones - N Reglas)
// =========================================================

/**
 * Obtiene TODAS las configuraciones de cupones de la base de datos (N Reglas).
 * @route GET /api/admin/coupon-config
 */
exports.getCouponConfig = async (req, res) => {
    try {
        const sql = `SELECT * FROM config_cupones ORDER BY id ASC`;
        const [configurations] = await db.execute(sql); 

        return res.json({
            success: true,
            configurations: configurations // Devuelve el listado completo
        });

    } catch (error) {
        console.error("❌ Error al obtener configuraciones de cupones:", error.message);
        return res.status(500).json({
            success: false,
            message: "Error interno al obtener la configuración de cupones."
        });
    }
};

/**
 * Actualiza una regla existente o inserta una nueva. (N-rules model)
 * Incluye validación de coherencia estricta.
 * @route POST /api/admin/coupon-config/update
 */
exports.updateCouponConfig = async (req, res) => {
    try {
        const {
            id, // ID para UPDATE o NULL para INSERT
            activa,
            descuento,
            tipo_expiracion,
            duracion_valor,
            duracion_unidad,
            usos_maximos,
            descripcion
        } = req.body;
        
        // 1. Validar campos obligatorios
        if (descuento === undefined || !tipo_expiracion) {
            return res.status(400).json({ success: false, message: "Descuento y Tipo de expiración son obligatorios." });
        }
        
        // 2. LÓGICA DE VALIDACIÓN DE COHERENCIA (Mantenida)
        let finalDuracionValor = duracion_valor || null;
        let finalDuracionUnidad = duracion_unidad || null;
        let finalUsosMaximos = usos_maximos || null;

        if (tipo_expiracion === 'tiempo' || tipo_expiracion === 'ambos') {
            if (!duracion_valor || duracion_valor <= 0 || !duracion_unidad) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Si la expiración incluye 'tiempo', 'duracion_valor' y 'duracion_unidad' son obligatorios." 
                });
            }
        } else {
            finalDuracionValor = null;
            finalDuracionUnidad = null;
        }

        if (tipo_expiracion === 'uso' || tipo_expiracion === 'ambos') {
            if (!usos_maximos || usos_maximos <= 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Si la expiración incluye 'uso', 'usos_maximos' es obligatorio y debe ser mayor que cero." 
                });
            }
        } else {
            finalUsosMaximos = null;
        }

        // 3. UPSERT LÓGICO
        if (id) {
            // UPDATE
            const updateSql = `
                UPDATE config_cupones 
                SET activa = ?, tipo_expiracion = ?, duracion_valor = ?, 
                    duracion_unidad = ?, usos_maximos = ?, descuento = ?, descripcion = ? 
                WHERE id = ?
            `;
            
            const updateValues = [
                activa,
                tipo_expiracion,
                finalDuracionValor,
                finalDuracionUnidad,
                finalUsosMaximos,
                descuento,
                descripcion || null,
                id
            ];

            await db.execute(updateSql, updateValues);
            
            return res.json({
                success: true,
                message: `Regla ID ${id} actualizada exitosamente.`
            });

        } else {
            // INSERT (Crear nueva regla)
            const insertSql = `
                INSERT INTO config_cupones (activa, tipo_expiracion, duracion_valor, duracion_unidad, usos_maximos, descuento, descripcion)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            const insertValues = [
                activa,
                tipo_expiracion,
                finalDuracionValor,
                finalDuracionUnidad,
                finalUsosMaximos,
                descuento,
                descripcion || null
            ];
            
            const [insertResult] = await db.execute(insertSql, insertValues);
            
            return res.status(201).json({
                success: true,
                message: `Nueva Regla creada exitosamente con ID ${insertResult.insertId}.`
            });
        }

    } catch (error) {
        console.error("❌ Error al guardar configuración de cupones:", error);
        
        let errorMessage = `Error interno al guardar la configuración: ${error.message}`;
        if (error.sqlMessage) {
             errorMessage = `Error de Base de Datos: ${error.sqlMessage}`;
        }
        
        // Devolvemos el error de BD detallado
        return res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
}; // <--- SINTAXIS CORREGIDA

/**
 * Activa una regla específica (ID) y desactiva todas las demás (exclusividad).
 * @route POST /api/admin/coupon-config/toggle
 */
exports.toggleRuleStatus = async (req, res) => {
    let connection;
    try {
        const { id, activa } = req.body;

        if (!id) {
            return res.status(400).json({ success: false, message: "El ID de la regla es obligatorio." });
        }
        
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Si se pide activar, aseguramos que solo esa sea TRUE
        if (activa === true || activa === 1) {
            // 1. Desactivar todas las reglas existentes
            const deactivateSql = `UPDATE config_cupones SET activa = FALSE`;
            await connection.execute(deactivateSql);

            // 2. Activar solo la regla con el ID proporcionado
            const activateSql = `UPDATE config_cupones SET activa = TRUE WHERE id = ?`;
            const [result] = await connection.execute(activateSql, [id]);

            if (result.affectedRows === 0) {
                await connection.rollback();
                return res.status(404).json({ success: false, message: `No se encontró la regla con ID ${id}.` });
            }
            
            await connection.commit();
            return res.json({ success: true, message: `Regla ID ${id} activada exitosamente. Todas las demás han sido desactivadas.` });

        } else {
            // Si se pide desactivar, simplemente la desactivamos.
            const deactivateOneSql = `UPDATE config_cupones SET activa = FALSE WHERE id = ?`;
            await connection.execute(deactivateOneSql, [id]);
            await connection.commit();
            return res.json({ success: true, message: `Regla ID ${id} desactivada exitosamente.` });
        }

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error("❌ Error en toggleRuleStatus:", error);
        
        let errorMessage = `Error interno al cambiar el estado de la regla: ${error.message}`;
        if (error.sqlMessage) {
             errorMessage = `Error de Base de Datos: ${error.sqlMessage}`;
        }
        
        return res.status(500).json({ 
            success: false, 
            message: errorMessage
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}; // <--- SINTAXIS CORREGIDA