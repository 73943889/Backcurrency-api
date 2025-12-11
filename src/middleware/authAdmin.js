// src/middleware/authAdmin.js

const jwt = require('jsonwebtoken');
// Se recomienda usar una clave secreta fuerte de las variables de entorno
const JWT_SECRET = process.env.JWT_SECRET; 

const authAdmin = (req, res, next) => {
    // 1. Obtener el token del header (ej. Authorization: Bearer <token>)
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Acceso denegado. Token no proporcionado.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // 2. Verificar y decodificar el token
        const decoded = jwt.verify(token, JWT_SECRET);

        // 3. Asegurar que el token tenga el rol 'admin'
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Acceso denegado. Permisos insuficientes (No es administrador).' });
        }

        req.user = decoded; // Adjuntar info del admin para auditoría
        next(); 
        
    } catch (ex) {
        // Error si el token es inválido o expiró
        res.status(400).json({ message: 'Token inválido o expirado.' });
    }
};

module.exports = authAdmin;