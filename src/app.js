const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const stringSimilarity = require('string-similarity');

const app = express();
const PORT = process.env.PORT || 3000;




app.use(function(req, res, next) {
res.header("Access-Control-Allow-Origin", "https://waltercastedo.github.io");
res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Length, X-Requested-With");
// Permitir que el navegador envíe solicitudes con credenciales (cookies, tokens, etc.)
res.header("Access-Control-Allow-Credentials", true);
// Si es una solicitud OPTIONS, enviar una respuesta exitosa para indicar que el servidor acepta el método y los encabezados
if (req.method === 'OPTIONS') {
    res.sendStatus(200);
} else {
    next();
}
});
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 8.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36',
    'Mozilla/5.0 (Windows NT 8.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36',
    // Agrega más user agents según sea necesario
];

function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Ruta para obtener los productos de Fidalga
app.get('/fidalga', async (req, res) => {
  try {
      const query = req.query.q; // Obtener el término de búsqueda de la URL

      const url = `https://www.fidalga.com/search?q=${encodeURIComponent(query)}&type=product`;

      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      const products = [];

      $('.products-grid.product-search.row.product-collection').find('.inner.product-item').each((index, element) => {
          const productName = $(element).find('.product-title span').text().trim();
          const productPriceText = $(element).find('.price-regular span').text().trim().replace('Bs', '').replace(',', '.');
          const productPrice = parseFloat(productPriceText) || 0;
          const productImageURL = $(element).find('.images-one').attr('data-srcset'); // Obtener el valor del atributo data-srcset

          // Expresión regular para extraer la URL de la imagen
          const regex = /www[^,]+/;
          const match = productImageURL.match(regex);
          const imageUrl = match ? match[0] : null;

          // Calcular la similitud entre el nombre del producto y el término de búsqueda
          const similarity = stringSimilarity.compareTwoStrings(productName.toLowerCase(), query.toLowerCase());

          // Si la similitud es superior a un cierto umbral (por ejemplo, 0.2) y la URL de la imagen es válida, agregar el producto a la lista
          if (similarity > 0.2 ) {
              products.push({
                  name: productName,
                  price: productPrice,
                  image: imageUrl, // Agregar la URL de la imagen
                  similarity: similarity // Opcional: puedes guardar la similitud para su uso posterior si lo deseas
              });
          }
      });

      res.json(products); // Devolver la lista de productos como respuesta JSON
  } catch (error) {
      console.error(error);
      res.status(500).send('Error interno del servidor');
  }
});
// Endpoint para realizar la solicitud a PedidosYa
app.get('/pedidosya', async (req, res) => {
    try {
        const searchTerm = req.query.q ;

        const headers = {
            'User-Agent': getRandomUserAgent(),
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Accept-Language': 'es-419,es;q=0.6',
            'Referer': 'https://www.pedidosya.com.bo/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'X-Requested-With': 'XMLHttpRequest'
        };

        const response = await axios.get('https://www.pedidosya.com.bo/mobile/v3/catalogues/209021/search', {
            params: {
                max: 50,
                offset: 0,
                partnerId: 201598,
                query: searchTerm,
                sort: 'price'
            },
            headers: headers
        });
        console.log(response.data.data)
        const products = response.data.data
            .map(item => ({
                name: item.name,
                price: item.price,
                image:item.image,
                similarity: stringSimilarity.compareTwoStrings(item.name.toLowerCase(), searchTerm.toLowerCase()) // Calcular similitud
            }))
            .filter(item => item.similarity > 0.2) // Filtrar por similitud mayor a 0.5
            .sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

        res.json(products);
    } catch (error) {
        console.error('Error al hacer la solicitud a PedidosYa:', error);
        res.status(500).json({ error: 'Error al obtener datos de PedidosYa' });
    }
});


app.get('/amarket', async (req, res) => {
  try {
      const query = req.query.q; // Obtener el término de búsqueda de la URL

      const url = `https://amarket.com.bo/search?type=article%2Cpage%2Cproduct&q=${encodeURIComponent(query)}`;

      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      const products = [];

      $('li.productgrid--item').each((index, element) => {
        const productName = $(element).find('.productitem--title a').text().trim();
        const productPriceText = $(element).find('.price__current--emphasize .money').text();
        const match = productPriceText.match(/\d+,\d+/);
        const firstPrice = (match ? match[0] : null);
        const productPrice = firstPrice ? parseFloat(firstPrice.replace(',', '.')) : null;
        const productImageURL = $(element).find('.productitem--image-primary').attr('src'); // Obtener el valor del atributo src de la imagen
    
        // Calcular la similitud entre el nombre del producto y el término de búsqueda
        const similarity = stringSimilarity.compareTwoStrings(productName.toLowerCase(), query.toLowerCase());
    
        // Si la similitud es superior a un cierto umbral (por ejemplo, 0.2) y la URL de la imagen es válida, agregar el producto a la lista
        if (similarity > 0.2) {
            products.push({
                name: productName,
                price: productPrice,
                image: productImageURL, // Agregar la URL de la imagen
                similarity: similarity // Opcional: puedes guardar la similitud para su uso posterior si lo deseas
            });
        }
    });

      res.json(products); // Devolver la lista de productos como respuesta JSON
  } catch (error) {
      console.error(error);
      res.status(500).send('Error interno del servidor');
  }
});

app.get('/icnorte', async (req, res) => {
  try {
      const searchTerm = req.query.q ;

     

      const response = await axios.get(`https://www.icnorte.com/api/catalog_system/pub/products/search/busca?O=OrderByTopSaleDESC&ft=${encodeURIComponent(searchTerm)}&fq=specificationFilter_24:`, {
  
      });
      const products = response.data.map(item => ({
        name: item.productName,
        price: item.items[0].sellers[0].commertialOffer.Price,
        image: item.items[0].images[0].imageUrl,
        link: item.link,
        similarity: stringSimilarity.compareTwoStrings(item.productName.toLowerCase(), searchTerm.toLowerCase())
    }))
    .filter(item => item.similarity > 0.2)
    .sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    
    res.json(products);
  } catch (error) {
      console.error('Error al hacer la solicitud a icnorte:', error);
      res.status(500).json({ error: 'Error al obtener datos de PedidosYa' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
