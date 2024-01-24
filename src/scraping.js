const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://www.fidalga.com/search?q=coca%20cola*&type=product')
  .then((response) => {
    const $ = cheerio.load(response.data);

    // Array para almacenar la información de los productos
    const products = [];

    // Selecciona todos los elementos con la clase 'inner product-item'
    $('.inner.product-item').each((index, element) => {
      const productName = $(element).find('.product-title span').text().trim();
      const productPriceText = $(element).find('.price-regular span').text().trim().replace('Bs', '').replace(',', '.');

      // Convierte el precio a un número decimal
      const productPrice = parseFloat(productPriceText) || 0;

      // Modifica el selector para obtener la URL de la imagen
    
      // Almacena la información del producto en el array
      products.push({
        name: productName,
        price: productPrice,
 
      });
    });

    // Ordena el array de productos por precio de menor a mayor
    products.sort((a, b) => a.price - b.price);

    // Imprime los datos ordenados
    products.forEach((product) => {
      console.log(`Nombre: ${product.name}`);
      console.log(`Precio: Bs${product.price.toFixed(2)}`); // Asegura que el precio tenga dos decimales
 
      console.log('-------------------');
    });
  })
  .catch((error) => {
    console.error('Error al hacer la solicitud:', error);
  });
