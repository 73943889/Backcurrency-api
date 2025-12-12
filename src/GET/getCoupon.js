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
async function fetchAndRenderCoupons() {
    const tableBody = document.getElementById('coupon-table-body');
    const statusElement = document.getElementById('coupons-list-status'); // Asegúrate de que exista en el HTML

    tableBody.innerHTML = '<tr><td colspan="8">Cargando cupones...</td></tr>'; // Cambié colspan a 8

    try {
        // CORRECCIÓN RUTA: Se usa la ruta que enviaste en el primer mensaje
        const response = await fetch(`${API_BASE_URL}/api/admin/coupon/all`, { 
            method: 'GET',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        const data = await response.json();

        if (data.success && data.coupons) {
            tableBody.innerHTML = ''; // Limpiar
            
            // Creación de encabezado (Revisada para asegurar 8 columnas)
            const table = document.getElementById('coupons-table');
            if (table.querySelector('thead') === null) {
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Código</th>
                            <th>Descuento</th>
                            <th>Usuario Asignado</th> 
                            <th>Usos (Actual/Máx)</th>
                            <th>Expira</th>
                            <th>Estado</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody id="coupon-table-body"></tbody>
                `;
            }
            
            const tbody = document.getElementById('coupon-table-body');

            data.coupons.forEach(coupon => {
                const row = tbody.insertRow();
                
                // Columna 0: ID
                row.insertCell(0).textContent = coupon.id;
                // Columna 1: Código
                row.insertCell(1).textContent = coupon.codigo;
                // Columna 2: Descuento
                row.insertCell(2).textContent = `${(parseFloat(coupon.descuento) * 100).toFixed(2)}%`; 
                
                // ⭐️ CORRECCIÓN CLAVE 1: Insertar la celda del usuario en el índice 3
                const userDisplay = coupon.user_email || `<span class="badge badge-primary">Genérico</span>`;
                const userCell = row.insertCell(3);
                userCell.innerHTML = userDisplay;
                
                // Columna 4: Usos (anteriormente índice 3)
                const usesCell = row.insertCell(4);
                usesCell.textContent = `${coupon.usos_actuales || 0} / ${coupon.usos_maximos || '∞'}`;

                // Columna 5: Expira (anteriormente índice 4)
                row.insertCell(5).textContent = coupon.expiracion ? new Date(coupon.expiracion).toLocaleDateString() : 'Nunca';
                
                // Determinar el estado visual
                const estado = coupon.usado ? 'USADO' : 
                               (coupon.inhabilitado == 1) ? 'INHABILITADO' :
                               (coupon.usos_maximos !== null && coupon.usos_actuales >= coupon.usos_maximos) ? 'AGOTADO' :
                               (coupon.expiracion && new Date(coupon.expiracion) < new Date()) ? 'EXPIRADO' : 'ACTIVO';
                
                // Columna 6: Estado (anteriormente índice 5)
                const statusCell = row.insertCell(6);
                statusCell.textContent = estado;
                statusCell.className = `status-${estado.toLowerCase()}`;
                
                // Columna 7: Acción (anteriormente índice 6)
                // Se agregó la lógica de asignación/desasignación, asumiendo que existen esas funciones
                const actionButton = coupon.user_id 
                    ? `<button onclick="unassignCoupon(${coupon.id})" class="button-danger button-small">Desasignar</button>`
                    : `<button onclick="openAssignUserModal(${coupon.id}, '${coupon.codigo}')" class="button-secondary button-small">Asignar</button>`;
                    
                row.insertCell(7).innerHTML = actionButton + `<button onclick="deleteCoupon(${coupon.id})" style="margin-left: 5px;">Eliminar</button>`;
            });
            
            if (statusElement) {
                statusElement.textContent = `Lista de cupones cargada (${data.coupons.length}).`;
                statusElement.className = 'success';
            }


        } else {
            if (statusElement) {
                statusElement.textContent = `Fallo al cargar cupones: ${data.message || 'Error desconocido'}`;
                statusElement.className = 'error';
            }
            tableBody.innerHTML = `<tr><td colspan="8" class="error">Fallo al cargar cupones: ${data.message || 'Error desconocido'}</td></tr>`;
        }

    } catch (error) {
        if (statusElement) {
            statusElement.textContent = 'Error de red al cargar cupones.';
            statusElement.className = 'error';
        }
        tableBody.innerHTML = '<tr><td colspan="8" class="error">Error de red al cargar cupones.</td></tr>';
        console.error('Error al cargar cupones:', error);
    }
}

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
 * @route POST /api/admin/coupon/assign
 */
exports.assignCouponToUser = async (req, res) => {
    try {
        const { couponId, userId } = req.body;

        if (!couponId || !userId) {
            return res.status(400).json({ success: false, message: "ID de cupón y ID de usuario son obligatorios." });
        }

        // 1. Validar que el cupón exista
        const [existing] = await db.execute('SELECT id, user_id FROM cupones WHERE id = ?', [couponId]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: "Cupón no encontrado." });
        }
        
        // 2. Realizar la asignación
        const sql = `UPDATE cupones SET user_id = ? WHERE id = ?`;
        const [result] = await db.execute(sql, [userId, couponId]);

        if (result.affectedRows === 0) {
            return res.status(500).json({ success: false, message: "Fallo al asignar el cupón (posiblemente ya estaba asignado a ese ID)." });
        }

        return res.json({
            success: true,
            message: `Cupón ID ${couponId} asignado con éxito al usuario ID ${userId}.`
        });

    } catch (error) {
        console.error("❌ Error al asignar cupón:", error);
        // Error de SQL (ej. violación de FOREIGN KEY si el usuario no existe)
        let errorMessage = "Error interno del servidor al asignar el cupón.";
        if (error.sqlMessage) {
            errorMessage = `Error de Base de Datos: ${error.sqlMessage}. Revise si el ID de usuario existe.`;
        }

        return res.status(500).json({
            success: false,
            message: errorMessage
        });
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
 * Obtiene todos los cupones de la base de datos para el panel de administración.
 * @route GET /api/admin/coupons
 */
exports.getAllCoupons = async (req, res) => {
    try {
        // Consulta SQL con LEFT JOIN para obtener el email del usuario asignado
        const sql = `
            SELECT 
                c.*, 
                u.email AS user_email
            FROM 
                cupones c
            LEFT JOIN 
                users u ON c.user_id = u.id
            ORDER BY 
                c.id DESC
        `;
        const [coupons] = await db.execute(sql);

        return res.json({
            success: true,
            coupons: coupons
        });
    } catch (error) {
        console.error("❌ Error al obtener cupones:", error);
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor al obtener la lista de cupones."
        });
    }
};