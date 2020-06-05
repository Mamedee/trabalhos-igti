const express = require('express'); //passa a lib para uma variável
const fs = require('fs'); //módulo já incluído na instalação do npm
const router = express.Router();

const fileStates = 'estados.json';
const fileCities = 'cidades.json';
const dirStates = './estados/';
const api = 'http://localhost:3000/locations/';
const fetch = require("node-fetch");

let arrayJsonStates;
let arrayJsonCities;
let arrayCompleteLocation=[];
let arrayStatesNumCities=[];

router.get('/menor-cidade-por-estado', (request,response) => {
   try {
      loadStatesCities(false);

      let menoresCidadesPorEstado=[];
      
      if (arrayCompleteLocation.length > 0) {         

         for (let i=0; i<arrayCompleteLocation.length; i++) {
            let indiceMenorCidade=0;
            
            for(let j=0; j<arrayCompleteLocation[i].Cidades.length;j++) {
               
               let menorCidade = arrayCompleteLocation[i].Cidades[indiceMenorCidade].length;
               let cidadeAtual = arrayCompleteLocation[i].Cidades[j].length;
               
               if(cidadeAtual < menorCidade) {
                  menorCidade = arrayCompleteLocation[i].Cidades[j].length;
                  indiceMenorCidade = j;
               } else if (cidadeAtual === menorCidade) {
                  let menor = arrayCompleteLocation[i].Cidades[indiceMenorCidade];
                  let desafiante = arrayCompleteLocation[i].Cidades[j];
                  let disputa = [];
                  disputa.push([menor,indiceMenorCidade]);
                  disputa.push([desafiante,j]);
                  disputa.sort();
                  indiceMenorCidade=disputa[0][1];                  
               }
            }
            menoresCidadesPorEstado.push([arrayCompleteLocation[i].Cidades[indiceMenorCidade], arrayCompleteLocation[i].Sigla]);            
         }
      }

      response.status(200).send(menoresCidadesPorEstado);
   } catch (error) {
      response.status(400).send({error:error.message});
   }
} );

router.get('/maior-cidade-por-estado', (request,response) => {
   try {
      loadStatesCities(false);

      let maioresCidadesPorEstado=[];
      
      if (arrayCompleteLocation.length > 0) {         

         for (let i=0; i<arrayCompleteLocation.length; i++) {
            let indiceMaiorCidade=0;
            for(let j=0; j<arrayCompleteLocation[i].Cidades.length;j++) {
               
               let maiorCidade = arrayCompleteLocation[i].Cidades[indiceMaiorCidade].length;
               let cidadeAtual = arrayCompleteLocation[i].Cidades[j].length;
               
               if(cidadeAtual > maiorCidade) {
                  maiorCidade = arrayCompleteLocation[i].Cidades[j].length;
                  indiceMaiorCidade = j;
               } else if (cidadeAtual === maiorCidade) {
                  let maior = arrayCompleteLocation[i].Cidades[indiceMaiorCidade];
                  let desafiante = arrayCompleteLocation[i].Cidades[j];
                  let disputa = [];
                  disputa.push([maior,indiceMaiorCidade]);
                  disputa.push([desafiante,j]);
                  disputa.sort();
                  indiceMaiorCidade=disputa[0][1];                  
               }
            }
            maioresCidadesPorEstado.push([arrayCompleteLocation[i].Cidades[indiceMaiorCidade], arrayCompleteLocation[i].Sigla]);
         }
      }

      response.status(200).send(maioresCidadesPorEstado);
   } catch (error) {
      response.status(400).send({error:error.message});
   }
} );

router.get('/cinco-menores-estados', (request,response) => {

   try {
      loadFromStatesFiles();
      
      let arrayBottomFive=[];

      if (arrayStatesNumCities.length > 0) {
         
         let i=0;
         let indiceMenor=0;

         for(;;) {
            for (let j=0; j<arrayStatesNumCities.length; j++) {
               if (parseInt(arrayStatesNumCities[j][1]) < parseInt(arrayStatesNumCities[indiceMenor][1])) {
                  indiceMenor = j;
               }
            }

            arrayBottomFive.push([arrayStatesNumCities[indiceMenor][0], arrayStatesNumCities[indiceMenor][1]]);
            arrayStatesNumCities[indiceMenor][1]="1000000";
            indiceMenor = 0;

            if (i>=4) {
               arrayBottomFive.reverse();
               break; 
            }
            else {
               i++;
            }
         }

      }

      response.send(arrayBottomFive);
   } catch (error) {
      response.status(400).send({error:error.message});
   }
});

router.get('/cinco-maiores-estados', (request,response) => {

   try {
      loadFromStatesFiles();
      
      let arrayTopFive=[];

      if (arrayStatesNumCities.length > 0) {
         
         let i=0;
         let indiceMaior=0;

         for(;;) {
            for (let j=0; j<arrayStatesNumCities.length; j++) {
               if (parseInt(arrayStatesNumCities[j][1]) > parseInt(arrayStatesNumCities[indiceMaior][1])) {
                  indiceMaior = j;
               }
            }

            arrayTopFive.push([arrayStatesNumCities[indiceMaior][0], arrayStatesNumCities[indiceMaior][1]]);
            arrayStatesNumCities[indiceMaior][1]="-1";
            indiceMaior = 0;

            if (i>=4) break; else i++;

         }

      }

      response.send(arrayTopFive);
   } catch (error) {
      response.status(400).send({error:error.message});
   }
});

router.get('/estado/:uf', (request,response) => {
   let ufParameter = request.params.uf.toUpperCase();
   let ufJsonFile = `${dirStates + ufParameter}.json`;

   try {
      if (!fs.existsSync(ufJsonFile)) {
         throw error("Arquivo `${ufParameter}` não encontrado");
      }

      fs.readFile(ufJsonFile, 'utf8', (error, data) => {
         if (error) throw error(`Erro ao abrir o aquivo ${ufJsonFile}`);

         const json = JSON.parse(data);
         let citiesNum = 0;

         for(let i=0; i<json.cidades.length; i++) {
            citiesNum++;
         };

         response.send(JSON.stringify({numcidades:citiesNum.toString()}));

      });

   } catch (error) {
      response.status(400).send({error:error});
   }
});

router.get('/criar-arquivos-estados', (_, response) => {
   try {
      loadStatesCities(true);
      response.status(200).send('Arquivos criados com sucesso.');
   } catch (error) {
      response.status(400).send({error:error.message});
   }
});

//***************************************************************************** */

function loadStatesCities(createFile=false) {
   if (fs.existsSync(fileStates) || fs.existsSync(fileCities)) {

      //trabalho no JSon das cidades
      //criar os arquivos dos estados
      fs.readFile(fileStates,'utf8', (error, data) => {            
         arrayJsonStates = JSON.parse(data);
         
         arrayJsonStates.forEach((element,index) => {
            arrayCompleteLocation.push({ID:element.ID,Sigla:element.Sigla,NCidades:0,Cidades:[]});

            if (createFile) {
               fileState = dirStates + element.Sigla + '.json';
               if (!fs.existsSync(fileState)) {
                  fs.writeFile(fileState,'', error => {
                     if (error) {
                        throw error('Falha ao criar o arquivo `${fileState}`.');
                     }
                  });
               }
            }
         });            
      });

      //trabalho no JSon das cidades
      fs.readFile(fileCities,'utf8', (error, data) => {            
         arrayJsonCities = JSON.parse(data);
         
         for (let i=0; i<arrayJsonCities.length; i++) {
            for(let j=0; j<arrayCompleteLocation.length;j++) {
               if (arrayCompleteLocation[j].ID === arrayJsonCities[i].Estado) {
                  arrayCompleteLocation[j].NCidades++;
                  arrayCompleteLocation[j].Cidades.push(arrayJsonCities[i].Nome);
                  break;
               }
            }
         }         

         if (createFile) {
            for (let i=0; i<arrayCompleteLocation.length; i++) {
               let fileStateFound = dirStates + arrayCompleteLocation[i].Sigla + '.json';

               if (fs.existsSync(fileStateFound)) {
                  let jsonCompleteLocation = {cidades : arrayCompleteLocation[i].Cidades}
                  fs.appendFile(fileStateFound,JSON.stringify(jsonCompleteLocation), error => {
                     if (error) {
                        throw error('Falha ao criar o arquivo `${fileState}`.');
                     }
                  });
               }
            }
            

            let fileCompleteLocation = 'complete.json';
            if (!fs.existsSync(fileCompleteLocation)) {
               fs.writeFile(fileCompleteLocation,JSON.stringify(arrayCompleteLocation), error => {
                  if (error) {
                     throw error('Falha ao criar o arquivo `${fileCompleteLocation}`.');
                  }
               });
            }
         }            
      });         
   } else {         
      throw error('Arquivos `${fileStates}` e `${fileCities}`não encontrados.');
   }   
}

function loadFromStatesFiles() {
   fs.readFile(fileStates,'utf8', (error, data) => {            
      if (error) throw error(`Erro ao abrir o arquivo ${sileStates}`);

      arrayJsonStates = JSON.parse(data);

      for(let i=0; i<arrayJsonStates.length;i++) {
         arrayStatesNumCities.push([arrayJsonStates[i].Sigla, null]);
      }

      let fet;

      for(let i=0; i<arrayStatesNumCities.length; i++) {
         
         fet = fetch(api + 'estado/' + arrayStatesNumCities[i][0].toLowerCase())
            .then((responseFromApi) => {               
               return responseFromApi.json().then((data) => {
                  loadToArray(data, i);
               }                
            );                  
         }).catch((error) => {
            throw error;
         });            
      }      
   });
}

function loadToArray(data, index) {
   arrayStatesNumCities[index][1] = data.numcidades;
}


//.................................................

module.exports = router;