const puppeteer = require('puppeteer');
router.get('/rates', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT from_currency, to_currency, buy_rate, sell_rate FROM exchange_rates WHERE active = 1'
    );

    const formatted = {};

    rows.forEach(rate => {
      const key = `${rate.from_currency}_${rate.to_currency}`;
      formatted[key] = {
        buy: rate.buy_rate,
        sell: rate.sell_rate
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener tasas' });
  }
});

module.exports = router;