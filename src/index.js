const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/scrape', async (req, res) => {
  try {
    // Lee el parámetro 'q' de la URL
    const query = req.query.q; // Valor predeterminado si no se proporciona el parámetro 'q'

    // Construye la URL con la consulta
    const url = `https://www.fidalga.com/search?q=${encodeURIComponent(query)}&type=product`;

    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Array para almacenar la información de los productos
    const products = [];

    // Selecciona todos los elementos con la clase 'products-grid'
    $('.products-grid .grid-item.col-6.col-md-4.grid-item-border.column-4').each((index, element) => {
      const productName = $(element).find('.product-title span').text().trim();
      const productPriceText = $(element).find('.price-regular span').text().trim().replace('Bs', '').replace(',', '.');
      const productPrice = parseFloat(productPriceText) || 0;
      const productLink = $(element).find('.product-image a').attr('href'); // Cambio aquí

      products.push({
        name: productName,
        price: productPrice,
        link: productLink,
        order: index + 1, // El orden es el índice + 1
      });
    });

    // Devuelve la lista de productos como respuesta JSON
    res.json(products);
  } catch (error) {
    console.error('Error al hacer la solicitud:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});