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
        
        // Validar unicidad del código
        const [existing] = await db.execute('SELECT id FROM cupones WHERE codigo = ?', [codigo]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: "El código de cupón ya existe." });
        }
        
        // Manejo de NULLs para user_id (ya que ahora permite NULL) y otros campos
        const finalUserId = (user_id && user_id > 0) ? user_id : null; 
        const finalExpiracion = expiracion || null;
        const finalUsosMaximos = usos_maximos || null;
        const finalTipoExpiracion = tipo_expiracion || 'manual'; // Default a 'manual'

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
        // Error de SQL (ej. violación de FOREIGN KEY por user_id, ahora solo si el ID no existe)
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor al crear el cupón. Revise si el ID de usuario existe."
        });
    }
};


// =========================================================
// B) GESTIÓN DE CONFIGURACIÓN MAESTRA (Tabla: config_cupones)
// =========================================================

/**
 * Obtiene la configuración global de cupones (asumiendo id=1).
 * @route GET /api/admin/coupon-config
 */
exports.getCouponConfig = async (req, res) => {
    try {
        const sql = `SELECT * FROM config_cupones WHERE id = 1`;
        const [config] = await db.execute(sql); 

        return res.json({
            success: true,
            // Devuelve la primera fila o null si la tabla está vacía
            config: config.length > 0 ? config[0] : null
        });

    } catch (error) {
        console.error("❌ Error al obtener configuración de cupones:", error.message);
        return res.status(500).json({
            success: false,
            message: "Error interno al obtener la configuración de cupones."
        });
    }
};

/**
 * Actualiza o inserta (UPSERT) la configuración global de cupones (id=1).
 * Incluye validación de coherencia estricta.
 * @route POST /api/admin/coupon-config/update
 */
exports.updateCouponConfig = async (req, res) => {
    try {
        const {
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
        
        // 🚀 LÓGICA DE VALIDACIÓN DE COHERENCIA (Protección del backend)
        let finalDuracionValor = duracion_valor || null;
        let finalDuracionUnidad = duracion_unidad || null;
        let finalUsosMaximos = usos_maximos || null;

        // a) Validar Expiración por Tiempo
        if (tipo_expiracion === 'tiempo' || tipo_expiracion === 'ambos') {
            if (!duracion_valor || duracion_valor <= 0 || !duracion_unidad) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Si la expiración incluye 'tiempo', 'duracion_valor' y 'duracion_unidad' son obligatorios." 
                });
            }
        } else {
            // Si es solo 'uso', forzar los campos de tiempo a NULL para la BD
            finalDuracionValor = null;
            finalDuracionUnidad = null;
        }

        // b) Validar Expiración por Uso
        if (tipo_expiracion === 'uso' || tipo_expiracion === 'ambos') {
            if (!usos_maximos || usos_maximos <= 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Si la expiración incluye 'uso', 'usos_maximos' es obligatorio y debe ser mayor que cero." 
                });
            }
        } else {
            // Si es solo 'tiempo', forzar el campo de usos a NULL para la BD
            finalUsosMaximos = null;
        }

        // 2. Intentar actualizar (asumiendo que id=1)
        const updateSql = `
            UPDATE config_cupones 
            SET activa = ?, tipo_expiracion = ?, duracion_valor = ?, 
                duracion_unidad = ?, usos_maximos = ?, descuento = ?, descripcion = ? 
            WHERE id = 1
        `;
        
        const updateValues = [
            activa,
            tipo_expiracion,
            finalDuracionValor,
            finalDuracionUnidad,
            finalUsosMaximos,
            descuento,
            descripcion || null
        ];

        const [updateResult] = await db.execute(updateSql, updateValues);
        
        // 3. Si no se actualizó ninguna fila (no existe, debe insertarse)
        if (updateResult.affectedRows === 0) {
            const insertSql = `
                INSERT INTO config_cupones (id, activa, tipo_expiracion, duracion_valor, duracion_unidad, usos_maximos, descuento, descripcion)
                VALUES (1, ?, ?, ?, ?, ?, ?, ?)
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
            
            await db.execute(insertSql, insertValues);
        }

        return res.json({
            success: true,
            message: "Configuración guardada exitosamente."
        });

    } catch (error) {
        console.error("❌ Error al guardar configuración de cupones:", error);
        return res.status(500).json({
            success: false,
            message: `Error interno al guardar la configuración: ${error.message}`
        });
    
	/**
 * Activa una regla específica (ID) y desactiva todas las demás.
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
                // Si no se encontró el ID, hacemos rollback para no dejar la tabla vacía.
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
        return res.status(500).json({ 
            success: false, 
            message: `Error interno al cambiar el estado de la regla: ${error.sqlMessage || error.message}`
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};
	
	
};