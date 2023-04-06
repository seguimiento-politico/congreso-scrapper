const https = require('https');
const fs = require('fs').promises;
const axios = require('axios');
const cheerio = require('cheerio');

const Initiative = require('../models/initiative');
const Legislature = require('../models/legislature');

// Define the scrapping URL and method
const options = {
    hostname: 'www.congreso.es',
    path: '',
    method: 'GET',
    headers: {
      'Cookie': '__cfduid=dce...d09; JSESSIONID=B8...350; acceptCookie=1;'
    }
  };

async function saveDataToDatabase(simplifiedData) {
  for (const initiativeData of simplifiedData) {
    const existingInitiative = await Initiative.findOne({
      initiativeId: initiativeData.initiativeId,
      legislature: initiativeData.legislature,
    });

    if (existingInitiative) {
      const isChanged = Object.keys(initiativeData).some(key => initiativeData[key] !== existingInitiative[key]);
      if (isChanged) {
        await Initiative.findByIdAndUpdate(existingInitiative._id, initiativeData);
      }
    } else {
      await Initiative.create(initiativeData);
    }
  }
}

async function saveDataToFile(simplifiedData, overwrite = false) {
    try {
        await fs.mkdir('data');
    } catch (err) {
        if (err.code !== 'EEXIST') throw err;
    }

    try {
      let existingData = [];
  
      if (!overwrite) {
        try {
          const content = await fs.readFile('data/initiatives.json', 'utf8');
          if (content) {
            existingData = JSON.parse(content);
          }
        } catch (err) {
          if (err.code !== 'ENOENT') throw err;
        }
      }
  
      const newData = existingData.concat(simplifiedData);
      const jsonData = JSON.stringify(newData);
  
      await fs.writeFile('data/initiatives.json', jsonData, 'utf8');
    } catch (err) {
      console.error('Error saving data to file:', err);
    }
}

async function saveData(data, overwrite) {
    const simplifiedData = data.map(iniciativa => {
      return {
        legislature: iniciativa.legislatura,
        initiativeId: iniciativa.id_iniciativa,
        topology: iniciativa.id_iniciativa.split('/')[0],
        superType: current_supertype,
        type: current_type,
        subType: current_subtype,
        title: iniciativa.titulo,
        startDate: iniciativa.fecha_presentado,
        endDate: iniciativa.fecha_calificado,
        author: iniciativa.autor,
        result: iniciativa.resultado_tram,
        url: `https://www.congreso.es/es/busqueda-de-iniciativas?p_p_id=iniciativas&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&_iniciativas_mode=mostrarDetalle&_iniciativas_legislatura=${iniciativa.legislatura}&_iniciativas_id=${iniciativa.id_iniciativa}`
      };
    });
  
    saveDataToFile(simplifiedData, overwrite);
    saveDataToDatabase(simplifiedData);
}

async function fetchLegislatures() {
    try {
      console.log(`Fetching Legislatures...`);

      const response = await axios.get('https://www.congreso.es/es/busqueda-de-iniciativas');
      const $ = cheerio.load(response.data);
      const legislatureOptions = $('#_iniciativas_legislatura option');
      const legislatures = [];
  
      legislatureOptions.each((i, option) => {
        const legislatureText = $(option).text().trim();
        let legislature = legislatureText.substring(0, legislatureText.indexOf("(")).trim().split(' ')[0];
        const datesText = legislatureText.substring(legislatureText.indexOf("(") + 1, legislatureText.indexOf(")")).trim();
        const dates = datesText.split("-");
        const startDate = dates[0];
        const endDate = dates[1];
        
        if(legislature !== ""){
            if(legislature == "Legislatura") legislature = "Constituyente";
            legislatures.push({ legislature, startDate, endDate });
        }
        
      });
  
      await fs.writeFile('data/legislatures.json', JSON.stringify(legislatures, null, 2));
  
      const existingLegislatures = await Legislature.find();
      const existingLegislatureNames = existingLegislatures.map(l => l.legislature);
      for (const legislature of legislatures) {
        if (existingLegislatureNames.includes(legislature.legislature)) {
          const existingLegislature = await Legislature.findOne({ legislature: legislature.legislature });
          if (existingLegislature.startDate !== legislature.startDate || existingLegislature.endDate !== legislature.endDate) {
            existingLegislature.startDate = legislature.startDate;
            existingLegislature.endDate = legislature.endDate;
            await existingLegislature.save();
            console.log(`Updated ${existingLegislature.legislature} legislature`);
          }
        } else {
          await Legislature.create(legislature);
          console.log(`Saved ${legislature.legislature} legislature to MongoDB`);
        }
      }
      console.log(`Fetching Legislatures... [Done]`);

    } catch (error) {
      console.error('Fetching Legislatures... [ERROR]', error);
    }
}
  
function fetchInitiativesData(page) {
    options.path = `/es/busqueda-de-iniciativas?p_p_id=iniciativas&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=filtrarListado&p_p_cacheability=cacheLevelPage&_iniciativas_legislatura=C&_iniciativas_titulo=&_iniciativas_texto=&_iniciativas_autor=&_iniciativas_competencias=&_iniciativas_tipo=&_iniciativas_tramitacion=&_iniciativas_expedientes=&_iniciativas_hasta=&_iniciativas_tipo_tramitacion=&_iniciativas_comision_competente=&_iniciativas_fase=&_iniciativas_organo=&_iniciativas_fechaDe=0&_iniciativas_fechaDesde=&_iniciativas_fechaHasta=&_iniciativas_materias=&_iniciativas_iniciativas_relacionadas=&_iniciativas_iniciativas_origen=&_iniciativas_iscc=&_iniciativas_paginaActual=${page}`;
    
    return new Promise((resolve, reject) => {
      https.request(options, res => {
        let responseData = '';
        res.on('data', chunk => {
          responseData += chunk;
        });
        res.on('end', () => {
          if (res.statusCode === 200) {
            const jsonData = JSON.parse(responseData);
            resolve(jsonData);
          } else {
            reject(new Error(`Error: ${res.statusCode} ${res.statusMessage}`));
          }
        });
      })
      .on('error', error => {
        reject(error);
      })
      .end();
    });
}

async function fetchALLInitiativesData() {
    let totalResults = 0;
    let fetchedResults = 0;
    let page = 1;
    let isFirstPage = true;
  
    // Función de comparación personalizada para ordenar por la clave 'iniciativaXXXX'
    function compareIniciativaKeys(a, b) {
      const keyA = parseInt(a.replace("iniciativa", ""));
      const keyB = parseInt(b.replace("iniciativa", ""));
  
      return keyA - keyB;
    }
  
    try {
      console.log(`Fetching Initiatives...`);

      const pageData = await fetchInitiativesData(page);
      totalResults = pageData.iniciativas_encontradas;
      fetchedResults += pageData.paginacion.docs_fin;
  
      console.log('Results found:' + totalResults);
      console.log('Total pages:' + Math.ceil(totalResults/25));
  
      let data = [];
      const sortedKeys = Object.keys(pageData.lista_iniciativas).sort(compareIniciativaKeys);
      for (const key of sortedKeys) {
        // reset topology data
        if(pageData.lista_iniciativas[key].atis)
        {
          current_supertype = pageData.lista_iniciativas[key].atis;
          current_type = null;
          current_subtype = null;
        } 
        if(pageData.lista_iniciativas[key].tpai)
        {
          current_type = pageData.lista_iniciativas[key].tpai;
          current_subtype = null;
        } 
        if(pageData.lista_iniciativas[key].tipo)
        {
          current_subtype = pageData.lista_iniciativas[key].tipo;
        } 
  
        data = data.concat(pageData.lista_iniciativas[key]); //format initiative data
      }
  
      await saveData(data, isFirstPage); // Save the data after each page fetch
  
      while (fetchedResults < totalResults) {
        console.log('Page:' + page);
        page++;
        data = []; // Reset the data array
        const pageData = await fetchInitiativesData(page);
        const sortedKeys = Object.keys(pageData.lista_iniciativas).sort(compareIniciativaKeys);
        for (const key of sortedKeys) {
  
          // reset topology data
          if(pageData.lista_iniciativas[key].atis)
          {
            current_supertype = pageData.lista_iniciativas[key].atis;
            current_type = null;
            current_subtype = null;
          } 
          if(pageData.lista_iniciativas[key].tpai)
          {
            current_type = pageData.lista_iniciativas[key].tpai;
            current_subtype = null;
          } 
          if(pageData.lista_iniciativas[key].tipo)
          {
            current_subtype = pageData.lista_iniciativas[key].tipo;
          } 
  
          data = data.concat(pageData.lista_iniciativas[key]);
        }
        fetchedResults += pageData.paginacion.docs_fin;
        isFirstPage = false;
        await saveData(data, isFirstPage);
      }
  
    } catch (error) {
      console.error(`Fetching Initiatives... [ERROR]`, error);
      console.log(`Last scrapped page: ${page}`);
    }
}
  
module.exports = {
    saveData,
    fetchALLInitiativesData,
    fetchLegislatures
  };
