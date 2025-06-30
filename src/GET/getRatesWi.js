const puppeteer = require('puppeteer');

const getWiseEuroRates = async () => {
  console.log('▶ Iniciando Puppeteer para Wise PEN ↔ EUR...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // PEN a EUR (venta)
    const penToEurUrl = 'https://wise.com/es/currency-converter/pen-to-eur-rate?amount=1';
    console.log(`▶ Navegando a: ${penToEurUrl}`);
    await page.goto(penToEurUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    const penToEurRate = await page.evaluate(() => {
      const h3s = Array.from(document.querySelectorAll('h3'));
      const target = h3s.find(el => el.textContent.includes('1 PEN ='));
      if (!target) throw new Error('No se encontró la tasa PEN → EUR');
      return parseFloat(target.textContent.match(/1 PEN = ([\d.,]+)/)[1].replace(',', '.')).toFixed(4);
    });
    console.log(`✔ PEN → EUR (venta): ${penToEurRate}`);

    // EUR a PEN (compra)
    const eurToPenUrl = 'https://wise.com/es/currency-converter/eur-to-pen-rate?amount=1';
    console.log(`▶ Navegando a: ${eurToPenUrl}`);
    await page.goto(eurToPenUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    const eurToPenRate = await page.evaluate(() => {
      const h3s = Array.from(document.querySelectorAll('h3'));
      const target = h3s.find(el => el.textContent.includes('1 EUR ='));
      if (!target) throw new Error('No se encontró la tasa EUR → PEN');
      return parseFloat(target.textContent.match(/1 EUR = ([\d.,]+)/)[1].replace(',', '.')).toFixed(4);
    });
    console.log(`✔ EUR → PEN (compra): ${eurToPenRate}`);

    await browser.close();

    return {
      penToEur: {
        compra: eurToPenRate,
        venta: penToEurRate
      }
    };
  } catch (error) {
    console.error('❌ Error al obtener tasas de Wise:', error.message);
    await browser.close();
    throw new Error('No se pudo obtener las tasas PEN ↔ EUR desde Wise');
  }
};

module.exports = getWiseEuroRates;