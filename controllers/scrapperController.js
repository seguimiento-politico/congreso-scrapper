const cheerio = require('cheerio');
const axios = require('axios');

const Initiative = require('../models/initiative');
const Legislature = require('../models/legislature');
const Topology = require('../models/topology');
const Representative = require('../models/representative');

const congressApi = require('../services/congressApi');

//Topology data to be inherited
let current_supertype = null;
let current_type = null;
let current_subtype = null;
let current_subsubtype = null;

async function saveData(data, overwrite) {
  const simplifiedData = data.map(iniciativa => {
    const newItem = {
      legislature: iniciativa.legislatura,
      initiativeId: iniciativa.id_iniciativa,
      title: iniciativa.titulo,
      startDate: iniciativa.fecha_presentado,
      endDate: iniciativa.fecha_calificado,
      author: iniciativa.autor,
      result: iniciativa.resultado_tram
    };    

    return newItem;
  });

  const initiative = new Initiative(simplifiedData);
  await initiative.saveInitiative(simplifiedData);

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

  const topology = new Topology(topologyData);
  await topology.saveTopology(topologyData);

}

async function fetchLegislatures() {
  console.log(`Fetching Legislatures...`);
  try {
    const response = await congressApi.getLegislatures();
    const $ = cheerio.load(response.data);

    const legislatures = [];
    const legislatureOptions = $('#_iniciativas_legislatura option');

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

    console.log('Número de legislaturas obtenidas:', legislatures.length);

    const savedLegislature = new Legislature();
    for (const legislature of legislatures) {
      await savedLegislature.updateLegislature(legislature);
    }

    console.log(`Fetching Legislatures... [Done]`);

  } catch (error) {
    console.error('Fetching Legislatures... [ERROR]', error.message);
  }
};
  
async function fetchRepresentatives(page) {
  const pageData = await congressApi.fetchRepresentatives(page);
  console.log(pageData);

  options.path = `/es/busqueda-de-diputados?p_p_id=diputadomodule&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=searchDiputados&p_p_cacheability=cacheLevelPage`;
  
  try {
    const response = await axios({
      method: options.method,
      url: `https://${options.hostname}${options.path}`,
      headers: options.headers,
    });

    const data = response.data;
    const congressPeople = data.data;

    // Hacer algo con la información de los diputados, por ejemplo, guardar en la base de datos o procesarla de alguna manera
    console.log(congressPeople);

  } catch (error) {
    console.error('Error al obtener información de los diputados:', error);
  }
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
    let page = 18950;
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
      const pageData = await congressApi.fetchInitiatives(page);
      totalResults = pageData.iniciativas_encontradas;
      fetchedResults += pageData.paginacion.docs_fin;
  
      console.log('Número de iniciativas obtenidas:', parseInt(totalResults));
      totalPages = Math.ceil(totalResults/25);
  
      let data = [];
      
      //TODO: reconvertir este pieza de codigo en una función reutilizable
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
        const pageData = await congressApi.fetchInitiatives(page);

        //TODO: reconvertir este pieza de codigo en una función reutilizable
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
    fetchLegislatures,
    fetchRepresentatives
};
