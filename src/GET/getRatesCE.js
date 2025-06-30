const puppeteer = require('puppeteer');

const getChangeEuroRates = async () => {
  console.log('▶ Iniciando Puppeteer...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const url = 'https://www.cambioeuro.es/euro-dolar/';

  try {
    console.log(`▶ Navegando a: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2' });

    console.log('▶ Esperando los selectores...');
    await page.waitForSelector('input[id=xconv-valuta]', { timeout: 15000 });
    await page.waitForSelector('input[id=conv-valuta]', { timeout: 15000 });

    console.log('▶ Obteniendo tasas de cambio...');
    const compra = await page.$eval('input[id=xconv-valuta]', el => el.value.trim());
    const venta = await page.$eval('input[id=conv-valuta]', el => el.value.trim());

    console.log(`✔ Compra: ${compra} | Venta: ${venta}`);

    await browser.close();

    // 🔧 ENVOLVEMOS en el formato esperado
    return {
      usdToEur: {
		compra: compra.replace(",", "."),
		venta: venta.replace(",", ".")
        
      }
    };

  } catch (error) {
    console.error('❌ Error al obtener las tasas:', error.message);
    await browser.close();
    throw new Error('No se pudo obtener las tasas de cambio desde Cambio Euro');
  }
};

module.exports = getChangeEuroRates;