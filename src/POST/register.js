const pool = require('../db');

const registerTransfer = async (req, res) => {
  console.log("Transferencia recibida:", req.body);
  const {
    sender_name,
    sender_email,
    sender_dni,
    amount_usd,
    converted_amount_pen,
    exchange_rate,
    destination_account,
    destination_bank
  } = req.body;

  if (
    !sender_name || !sender_email || !sender_dni ||
    !amount_usd || !converted_amount_pen || !exchange_rate ||
    !destination_account || !destination_bank
  ) {
    return res.status(400).json({ message: "Faltan campos obligatorios" });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO transfers (
        sender_name, sender_email, sender_dni,
        amount_usd, converted_amount_pen, exchange_rate,
        destination_account, destination_bank
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sender_name,
        sender_email,
        sender_dni,
        amount_usd,
        converted_amount_pen,
        exchange_rate,
        destination_account,
        destination_bank
      ]
    );

    res.status(201).json({ message: "Transferencia registrada", id: result.insertId });
  } catch (error) {
    console.error("Error al insertar en la base de datos:", error);
    res.status(500).json({ message: "Error al registrar la transferencia" });
  }
};

module.exports = registerTransfer;