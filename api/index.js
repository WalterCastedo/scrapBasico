// index.js

const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  try {
    const query = req.query.q || ''; // Valor predeterminado si no se proporciona el parámetro 'q'

    const url = `https://www.fidalga.com/search?q=${encodeURIComponent(query)}&type=product`;

    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const products = [];

    $('.products-grid .grid-item.col-6.col-md-4.grid-item-border.column-4').each((index, element) => {
      const productName = $(element).find('.product-title span').text().trim();
      const productPriceText = $(element).find('.price-regular span').text().trim().replace('Bs', '').replace(',', '.');
      const productPrice = parseFloat(productPriceText) || 0;
      const productLink = $(element).find('.product-image a').attr('href');

      products.push({
        name: productName,
        price: productPrice,
        link: productLink,
        order: index + 1,
      });
    });

    res.json(products);
  } catch (error) {
    console.error('Error al hacer la solicitud:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
