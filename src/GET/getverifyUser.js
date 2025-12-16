const pool = require('../db'); 

// Exportamos solo la función, no un router nuevo
const verifyUser = async (req, res) => {
    const { id } = req.params;
    try {
        // Corregido: Usar 'pool' o 'db' según como lo hayas importado arriba
        const [rows] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
        
        if (rows.length > 0) {
            return res.json({ success: true, message: "Usuario válido" });
        } else {
            return res.status(404).json({ success: false, message: "Usuario no existe" });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = verifyUser;