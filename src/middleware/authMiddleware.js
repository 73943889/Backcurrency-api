const jwt = require('jsonwebtoken');
// Asumo que tienes el JWT_SECRET disponible aquí o lo importas desde tu .env/config
const JWT_SECRET = process.env.JWT_SECRET; 

// Ya no necesitamos tokenStore, EXPIRATION_MINUTES ni addToken.

function authMiddleware(req, res, next) {
    // 1. Obtener y verificar el encabezado Authorization
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Se requiere token. Use "Authorization: Bearer [token]"' });
    }
    
    const token = authHeader.split(' ')[1]; 

    try {
        // 2. Verificar el token JWT
        // Esta función automáticamente:
        // a) Verifica la firma (que no haya sido alterado).
        // b) Verifica la expiración (claim 'exp' del token).
        const decoded = jwt.verify(token, JWT_SECRET); 
        
        // Opcional: Verificar el rol si solo quieres que pase un 'admin'
        if (decoded.role !== 'admin') {
             return res.status(403).json({ message: 'Acceso denegado: Se requiere rol de administrador.' });
        }
        
        // 3. Si es válido, adjuntar el payload decodificado al request
        req.admin = decoded; // Puedes acceder a req.admin.id o req.admin.role después
        
        next();
        
    } catch (err) {
        // 4. Manejo de errores de JWT (firma inválida, token expirado, etc.)
        if (err.name === 'TokenExpiredError') {
            return res.status(403).json({ message: 'Token expirado, inicia sesión nuevamente.' });
        }
        
        return res.status(403).json({ message: 'Token inválido o firma incorrecta.' });
    }
}

// Ya no exportamos addToken, solo authMiddleware
module.exports = {
    authMiddleware
};