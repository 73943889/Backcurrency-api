const axios = require('axios');
const db = require('../db');
require('dotenv').config();

async function convertCurrency(from, to, amount) {
  const apiKey = process.env.API_KEY;

  const response = await axios.get(`https://api.fastforex.io/convert?from=${from}&to=${to}&amount=${amount}&api_key=${apiKey}`, {
    params: { from, to, amount, api_key: apiKey }
  });

  const rate = response.data.result?.[to];
  if (!rate) throw new Error('Conversión no disponible.');

  const convertedAmount = (amount * rate).toFixed(2);

  await db.query(
    'INSERT INTO conversions (from_currency, to_currency, amount, converted_amount, rate) VALUES (?, ?, ?, ?, ?)',
    [from, to, amount, convertedAmount, rate]
  );

  return { from, to, amount, convertedAmount, rate };

}

module.exports = { convertCurrency };
