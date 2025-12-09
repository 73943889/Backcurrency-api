/*const puppeteer = require('puppeteer');

const getWesternUnionRates = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const url = 'https://www.westernunionperu.pe/cambiodemoneda';

  try {
    await page.goto(url, { waitUntil: 'networkidle2' });

    await page.waitForSelector('button[id=btnCompra]', { timeout: 15000 });
    await page.waitForSelector('button[id=btnVenta]', { timeout: 15000 });

    const compra = await page.$eval('button[id=btnCompra]', el => el.textContent.trim());
    const venta = await page.$eval('button[id=btnVenta]', el => el.textContent.trim());

    await browser.close();

    return {
      penToUsd: {
        compra,
        venta
      }
    };
  } catch (error) {
    await browser.close();
    throw new Error('No se pudo obtener las tasas de cambio desde Western Union');
  }
};

module.exports = getWesternUnionRates;*/
const getWesternUnionRates = async () => {
  return {
    penToUsd: {
      compra: "3.78",
      venta: "3.84"
    }
  };
};

module.exports = getWesternUnionRates;