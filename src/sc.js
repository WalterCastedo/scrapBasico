const puppeteer = require('puppeteer');

async function realizarBusqueda() {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled', '--disable-infobars'],
      defaultViewport: null,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    // Configurar el agente de usuario para que sea más similar a un navegador convencional
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3');

    // Evaluar código en el navegador para modificar el objeto navigator.webdriver
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    const url = 'https://www.pedidosya.com.bo/restaurantes/santa-cruz-de-la-sierra/amarket-virgen-de-cotoca-52bf4382-a117-4c65-8868-1081d07ecaf1-menu';
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Esperar a que el elemento de búsqueda se cargue
    await page.waitForSelector('.sc-breuTD.gYvdFA input#search_input');

    // Realizar la búsqueda
    const searchTerm = 'coca cola';
    const inputElementHandle = await page.$('.sc-breuTD.gYvdFA input#search_input');
    await inputElementHandle.type(searchTerm);
    await inputElementHandle.press('Enter');

    // Esperar a que la página se cargue completamente después de la búsqueda
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

    // Imprimir la URL actual después de la búsqueda
    const currentUrl = page.url();
    console.log('URL después de la búsqueda:', currentUrl);

    // Pausa aleatoria
    const randomDelay = () => new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
    await randomDelay();

    // Puedes realizar más acciones o extraer información según tus necesidades

    // Mantener el navegador abierto para inspección manual
    // await browser.close();
  } catch (error) {
    console.error('Error durante la automatización:', error.message);
  }
}

// Llamar a la función principal
realizarBusqueda();
