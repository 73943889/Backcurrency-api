const pool = require('../db');

const getExchangeRates = async () => {
  const [rows] = await pool.query(`
SELECT from_currency, to_currency, buy_rate, sell_rate
FROM exchange_rates
WHERE active = 1
`.trim());

  const formatted = {};

  rows.forEach(rate => {
    const key = `${rate.from_currency} a ${rate.to_currency}`; 
    // Ejemplo de clave generada: "USD a PEN"
    formatted[key] = {
      buy: rate.buy_rate,
      sell: rate.sell_rate
    };
  });

  return formatted;
};

module.exports = getExchangeRates;