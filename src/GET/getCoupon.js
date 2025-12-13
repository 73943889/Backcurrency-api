// src/controllers/CouponController.js
// Asume que tienes un archivo db.js o una función de conexión a la base de datos.
const db = require('../db'); 

// =========================================================
// A) GESTIÓN DE INSTANCIAS DE CUPONES (Tabla: cupones)
// =========================================================

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
};

/**
 * Asigna un cupón existente a un user_id específico.
 * * IMPLEMENTACIÓN CORREGIDA: Antes de asignar, inhabilita 
 * todos los demás cupones activos de ese usuario (Transacción).
 * @route POST /api/admin/coupon/assign
 */
exports.assignCouponToUser = async (req, res) => {
    let connection; // Variable para gestionar la conexión y transacción
    try {
        const { coupon_id, user_id } = req.body;

        if (!coupon_id || !user_id) {
            return res.status(400).json({ success: false, message: "ID de cupón y ID de usuario son obligatorios." });
        }

        // 1. Iniciar Transacción
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Opcional: Validar que el cupón a asignar exista.
        const [existing] = await connection.execute('SELECT id FROM cupones WHERE id = ?', [coupon_id]);
        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: "Cupón a asignar no encontrado." });
        }
        
        // 2. INHABILITAR CUPONES ANTERIORES: Desactivar todos los cupones previamente asignados al usuario,
        // excluyendo el cupón que estamos a punto de asignar.
        const deactivateSql = `
            UPDATE cupones 
            SET inhabilitado = 1 
            WHERE user_id = ? 
            AND id != ? 
            AND inhabilitado = 0  
        `;
        // Ejecutamos la inhabilitación de los cupones antiguos
        await connection.execute(deactivateSql, [user_id, coupon_id]); 
        
        
        // 3. ASIGNAR EL NUEVO CUPÓN: Asignar el cupón y asegurarse de que esté HABILITADO (inhabilitado = 0).
        const assignSql = `
            UPDATE cupones 
            SET user_id = ?, inhabilitado = 0 
            WHERE id = ?
        `;
        const [result] = await connection.execute(assignSql, [user_id, coupon_id]);

        if (result.affectedRows === 0) {
             // Si no se afectó ninguna fila, hacemos rollback.
             await connection.rollback();
             return res.status(500).json({ success: false, message: "Fallo al asignar el cupón (ID de cupón inválido o error en la transacción)." });
        }
        
        // 4. Finalizar Transacción
        await connection.commit();

        return res.json({
            success: true,
            message: `Cupón ID ${coupon_id} asignado con éxito al usuario ID ${user_id}. Los cupones anteriores han sido inhabilitados.`
        });

    } catch (error) {
        // En caso de cualquier error, hacer Rollback
        if (connection) {
            await connection.rollback();
        }
        console.error("❌ Error en la transacción de asignación/desactivación:", error);

        let errorMessage = "Error interno del servidor al asignar el cupón.";
        if (error.sqlMessage) {
            errorMessage = `Error de Base de Datos: ${error.sqlMessage}. Revise si el ID de usuario existe o el cupón tiene un problema.`;
        }

        return res.status(500).json({
            success: false,
            message: errorMessage
        });
    } finally {
        // Liberar la conexión
        if (connection) {
            connection.release();
        }
    }
};
/**
 * Habilita o inhabilita un cupón específico (Instancia).
 * @route POST /api/admin/coupon/toggle-inhabilitado
 */
exports.toggleCouponInhabilitado = async (req, res) => {
    try {
        const { id, inhabilitado } = req.body; // 'inhabilitado' debe ser 1 (true) o 0 (false)

        if (!id || inhabilitado === undefined) {
            return res.status(400).json({ success: false, message: "ID y el estado 'inhabilitado' son obligatorios." });
        }

        // 1. Verificar si el cupón existe (opcional, pero recomendable)
        const [existing] = await db.execute('SELECT id FROM cupones WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: "Cupón no encontrado." });
        }

        // 2. Realizar la actualización en la base de datos
        const sql = `UPDATE cupones SET inhabilitado = ? WHERE id = ?`;
        
        // El valor se pasa directamente, ya que debería ser 0 o 1
        const [result] = await db.execute(sql, [inhabilitado, id]); 

        const newState = inhabilitado == 1 ? 'inhabilitado' : 'habilitado';
        
        return res.json({
            success: true,
            message: `Cupón ID ${id} actualizado. Estado: ${newState}.`
        });

    } catch (error) {
        console.error("❌ Error al cambiar estado de inhabilitación:", error);
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor al cambiar el estado del cupón."
        });
    }
};
// =========================================================
// A) GESTIÓN DE INSTANCIAS DE CUPONES (Tabla: cupones)
// =========================================================

/**
 * Obtiene los cupones de la base de datos CON PAGINACIÓN para el panel de administración.
 * @route GET /api/admin/coupons?limit=10&offset=0
 */
exports.getAllCoupons = async (req, res) => { // ¡Asegúrate de que 'async' esté aquí!
    try {
        // 1. Obtener y validar parámetros de paginación desde la URL (query)
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;
        
        // 2. Consulta A: Obtener el TOTAL de registros 
        const countSql = `SELECT COUNT(c.id) AS total FROM cupones c`;
        const [countResult] = await db.execute(countSql); // await es válido gracias a 'async'
        const totalRecords = countResult[0].total; // Total de cupones en la BD

        // 3. Consulta B: Obtener los cupones para la página actual
        const couponsSql = `
            SELECT 
                c.*, 
                u.email AS user_email
            FROM 
                cupones c
            LEFT JOIN 
                users u ON c.user_id = u.id
            ORDER BY 
                c.id DESC
            LIMIT ? OFFSET ?
        `;
        
        // ⚠️ CORRECCIÓN: Usamos Number() para evitar el error de MySQL y forzar el tipo.
        const [coupons] = await db.execute(couponsSql, [Number(limit), Number(offset)]);

        // 4. Devolver la respuesta
        return res.json({
            success: true,
            total: totalRecords,
            coupons: coupons
        });
        
    } catch (error) {
        console.error("❌ Error al obtener cupones (con paginación):", error); 
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor al obtener la lista de cupones."
        });
    }
};

/**
 * Obtiene los usuarios de la base de datos para mostrarlos en el modal de asignación.
 * @route GET /api/admin/users
 */
exports.getUsersForAssignment = async (req, res) => {
    try {
        // Obtenemos solo los campos necesarios y limitamos la cantidad
        const sql = `
            SELECT id, email, type, created_at 
            FROM users 
            ORDER BY created_at DESC 
            LIMIT 500
        `;
        
        const [users] = await db.execute(sql);

        return res.json({
            success: true,
            users: users
        });

    } catch (error) {
        console.error("❌ Error al listar usuarios para asignación:", error);
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor al listar usuarios."
        });
    }
};

/**
 * Desasigna un cupón existente (establece user_id a NULL).
 * @route POST /api/admin/coupon/unassign
 */
exports.unassignCoupon = async (req, res) => {
    try {
        const { id } = req.body; // id es el ID del cupón

        if (!id) {
            return res.status(400).json({ success: false, message: "ID del cupón es obligatorio." });
        }

        // Establecer user_id a NULL para desasignar
        const sql = `UPDATE cupones SET user_id = NULL WHERE id = ?`;
        const [result] = await db.execute(sql, [id]);

        if (result.affectedRows === 0) {
             return res.status(404).json({ success: false, message: "Cupón no encontrado o ya estaba desasignado." });
        }

        return res.json({
            success: true,
            message: `Cupón ID ${id} desasignado exitosamente.`
        });

    } catch (error) {
        console.error("❌ Error al desasignar cupón:", error);
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor al desasignar cupón."
        });
    }
};