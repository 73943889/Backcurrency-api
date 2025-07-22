const pool = require('../db');

const getCouponValidity = async (req, res) => {
  const userId = req.params.userId;

  try {
    const [rows] = await pool.query(
      `SELECT codigo, tipo_expiracion, expiracion, usos_maximos, usos_actuales 
       FROM cupones 
       WHERE user_id = ? AND usado = FALSE`,
      [userId]
    );

    if (rows.length === 0) {
      return res.json({ success: false, message: "No hay cupón activo" });
    }

    const cupon = rows[0];
    let vigencia = "";

    if (cupon.tipo_expiracion === 'tiempo') {
      const now = new Date();
      const expDate = new Date(cupon.expiracion);
      const diasRestantes = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
      vigencia = diasRestantes > 0
        ? `Vence en ${diasRestantes} día(s)`
        : "Cupón vencido";
    } else if (cupon.tipo_expiracion === 'uso') {
      const restantes = cupon.usos_maximos - cupon.usos_actuales;
      vigencia = restantes > 0
        ? `Válido por ${restantes} uso(s) restante(s)`
        : "Cupón sin usos disponibles";
    } else {
      vigencia = "Cupón sin límite de vigencia";
    }

    return res.json({
      success: true,
      codigo: cupon.codigo,
      vigencia: vigencia,
    });
  } catch (error) {
    console.error("❌ Error al consultar vigencia del cupón:", error);
    res.status(500).json({ success: false, message: "Error del servidor" });
  }
};

module.exports = getCouponValidity;