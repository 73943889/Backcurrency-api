const pool = require('../db'); // ✅ igual que tu otro ejemplo

const getExchangeRates = async () => {
  const [rows] = await pool.query(`
    SELECT from_currency, to_currency, buy_rate, sell_rate
    FROM exchange_rates
    WHERE active = 1
  `);

  const formatted = {};

  rows.forEach(rate => {
    const key = `${rate.from_currency}_${rate.to_currency}`;
    formatted[key] = {
      buy: rate.buy_rate,
      sell: rate.sell_rate
    };
  });

  return formatted; // ✅ SOLO RETORNA DATA
};

module.exports = getExchangeRates; 