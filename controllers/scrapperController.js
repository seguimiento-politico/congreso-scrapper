const https = require('https');
const fs = require('fs').promises;
const axios = require('axios');
const cheerio = require('cheerio');

const Initiative = require('../models/initiative');
const Legislature = require('../models/legislature');
const Topology = require('../models/topology');

//Topology data to be inherited
let current_supertype = null;
let current_type = null;
let current_subtype = null;
let current_subsubtype = null;

// Define the scrapping URL and method
const options = {
    hostname: 'www.congreso.es',
    path: '',
    method: 'GET',
    headers: {
      'Cookie': '__cfduid=dce...d09; JSESSIONID=B8...350; acceptCookie=1;'
    }
  };

async function saveInitiativeToDatabase(data) {
  for (const initiativeData of data) {
    const existingInitiative = await Initiative.findOne({
      initiativeId: initiativeData.initiativeId,
      legislature: initiativeData.legislature,
    });

    if (existingInitiative) {
      const isChanged = Object.keys(initiativeData).some(key => initiativeData[key] !== existingInitiative[key]);
      if (isChanged) {
        console.log("----------  Actualizada iniciativa --------------");
        console.log("iniciativa original:");
        console.log(existingInitiative);
        console.log("iniciativa nueva:");
        console.log(initiativeData);
        await Initiative.findByIdAndUpdate(existingInitiative._id, initiativeData);
      }
    } else {
      await Initiative.create(initiativeData);
    }
  }
}

async function saveTopologyToDatabase(data) {
  for (const topologyData of data) {  
    const existingTopology = await Topology.findOne({
      code: topologyData.code
    });

    if (!existingTopology) {
      // Si la topología no existe, crear una nueva
      console.log("---------- Topología nueva ----------");
      console.log(topologyData);
      await Topology.create(topologyData);
    }
  }
}

async function saveData(data, overwrite) {
  const simplifiedData = data.map(iniciativa => {
    const newItem = {
      legislature: iniciativa.legislatura,
      initiativeId: iniciativa.id_iniciativa,
      title: iniciativa.titulo,
      startDate: iniciativa.fecha_presentado,
      endDate: iniciativa.fecha_calificado,
      author: iniciativa.autor,
      result: iniciativa.resultado_tram,
      url: `https://www.congreso.es/es/busqueda-de-iniciativas?p_p_id=iniciativas&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&_iniciativas_mode=mostrarDetalle&_iniciativas_legislatura=${iniciativa.legislatura}&_iniciativas_id=${iniciativa.id_iniciativa}`
    };    

    return newItem;
  });

  saveInitiativeToDatabase(simplifiedData);

  const topologyData = data.map(iniciativa => {
    const newItem = {
      code: iniciativa.id_iniciativa.split('/')[0],
      supertype: iniciativa.supertype
    };

    if (iniciativa.type) newItem.type = iniciativa.type;
    if (iniciativa.subtype) newItem.subtype = iniciativa.subtype;
    if (iniciativa.subsubtype) newItem.subsubtype = iniciativa.subsubtype;

    return newItem;
  });

  saveTopologyToDatabase(topologyData);
}


async function fetchLegislatures() {
  console.log(`Fetching Legislatures...`);
    try {
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
  
function fetchInitiatives(page) {
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

function setTopology(iniciativa) {
  if (iniciativa.atis) {
    current_supertype = iniciativa.atis.toLowerCase();
    current_type = null;
    current_subtype = null;
    current_subsubtype = null;

    if (iniciativa.atip) {
      current_type = iniciativa.atip.toLowerCase();
      if (iniciativa.tpai) {
        current_subtype = iniciativa.tpai.toLowerCase();
        if(iniciativa.tipo) { 
          current_subsubtype = iniciativa.tipo.toLowerCase();
        }
      } else if (iniciativa.tipo) { 
        current_subtype = iniciativa.tipo.toLowerCase();
      }
    } else if (iniciativa.tipo) { 
      current_type = iniciativa.tipo.toLowerCase();
    }
  } else if (iniciativa.atip) {
    current_type = iniciativa.atip.toLowerCase();
    current_subtype = null;
    current_subsubtype = null;
    if(iniciativa.tipo) current_subtype = iniciativa.tipo.toLowerCase();

  } else if (iniciativa.tpai) {
    current_type = iniciativa.tpai.toLowerCase();
    current_subtype = null;
    current_subsubtype = null;
    if(iniciativa.tipo) current_subtype = iniciativa.tipo.toLowerCase();

  } else if(iniciativa.tipo) { 
    if (current_subtype == null) {
      current_type = iniciativa.tipo.toLowerCase();
      current_subsubtype = null;
    } else if (current_subsubtype == null) {
      current_subtype = iniciativa.tipo.toLowerCase();
    } else {
      current_subsubtype = iniciativa.tipo.toLowerCase();
    }
  }
}

async function fetchALLInitiativesData() {
    let totalResults = 0;
    let fetchedResults = 0;
    let page = 1;
    let isFirstPage = false;
    let totalPages = 0;

    if(page == 1) isFirstPage = true;

    // Función de comparación personalizada para ordenar por la clave 'iniciativaXXXX'
    function compareIniciativaKeys(a, b) {
      const keyA = parseInt(a.replace("iniciativa", ""));
      const keyB = parseInt(b.replace("iniciativa", ""));
  
      return keyA - keyB;
    }
    
    console.log(`Fetching Initiatives...`);
    try {
      const pageData = await fetchInitiatives(page);
      totalResults = pageData.iniciativas_encontradas;
      fetchedResults += pageData.paginacion.docs_fin;
  
      console.log('Results found:' + totalResults);
      totalPages = Math.ceil(totalResults/25);
  
      let data = [];
      const sortedKeys = Object.keys(pageData.lista_iniciativas).sort(compareIniciativaKeys);
      for (const key of sortedKeys) {
        const iniciativa = pageData.lista_iniciativas[key];
        setTopology(iniciativa); // reset topology data

        if (current_supertype) iniciativa.supertype = current_supertype;
        if (current_type) iniciativa.type = current_type;
        if (current_subtype) iniciativa.subtype = current_subtype;
        if (current_subsubtype) iniciativa.subsubtype = current_subsubtype;

        data.push(iniciativa); //format initiative data
      }
  
      await saveData(data, isFirstPage); // Save the data after each page fetch
  
      while (fetchedResults < totalResults) {
        console.log('Page:' + page + "/" + totalPages);
        page++;
        isFirstPage = false;
        data = []; // Reset the data array
        const pageData = await fetchInitiatives(page);
        const sortedKeys = Object.keys(pageData.lista_iniciativas).sort(compareIniciativaKeys);
        for (const key of sortedKeys) {
          const iniciativa = pageData.lista_iniciativas[key];
          setTopology(iniciativa); // reset topology data
        
          if (current_supertype) iniciativa.supertype = current_supertype;
          if (current_type) iniciativa.type = current_type;
          if (current_subtype) iniciativa.subtype = current_subtype;
          if (current_subsubtype) iniciativa.subsubtype = current_subsubtype;

          data.push(iniciativa); //format initiative data
        }
        fetchedResults += pageData.paginacion.docs_fin;
        await saveData(data, isFirstPage);
      }
  
    } catch (error) {
      console.error(`Fetching Initiatives... [ERROR]`, error);
      console.log(`Last scrapped page: ${page}`);
    }
    console.log(`Fetching Initiatives... [Done]`);
}
  
module.exports = {
    fetchALLInitiativesData,
    fetchLegislatures
  };
