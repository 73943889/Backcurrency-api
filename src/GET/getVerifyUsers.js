const pool = require('../db'); 

const getVerifyUser = async (req, res) => {
    const { id } = req.params;
    try {
        // Asegúrate de usar 'pool' que es lo que importaste arriba
        const [rows] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
        
        if (rows.length > 0) {
            res.json({ success: true, message: "Usuario válido" });
        } else {
            res.status(404).json({ success: false, message: "Usuario no existe" });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = getVerifyUser;