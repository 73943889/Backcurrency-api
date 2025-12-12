// src/POST/adminLogin.js

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_DURATION = '30m';
const adminLoginHandler = (req, res) => {
    const { username, password } = req.body;

    // 1. Verificar credenciales contra Railway Env Vars
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        
        // 2. Credenciales correctas: Generar Token JWT con rol 'admin'
        const token = jwt.sign({ 
            id: username, // usar el username como ID
            role: 'admin' 
        }, JWT_SECRET, { expiresIn: TOKEN_DURATION }); 

        return res.status(200).json({ 
            success: true, 
            message: "Admin login exitoso", 
            token: token ,
			expires_in: TOKEN_DURATION
        });
    }

    // 3. Fallo de credenciales
    res.status(401).json({ success: false, message: "Credenciales de administrador inválidas." });
};

module.exports = adminLoginHandler;