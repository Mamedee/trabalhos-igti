const express = require('express');
const app = express(); //cria uma instância do express.
const endpoint = '/locations';
const locationsRouter = require('./routers/locations.js');


app.use(express.json()); //as requisições utilizarão objetos json
app.use(endpoint, locationsRouter);

app.listen(3000, () => {
   
   console.log('APS Started.');
});