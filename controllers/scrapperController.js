const cheerio = require('cheerio');
const axios = require('axios');

const Initiative = require('../models/initiative');
const Legislature = require('../models/legislature');
const Topology = require('../models/topology');
const Representative = require('../models/representative');

const congressApi = require('../services/congressApi');
const convertionUtils = require('../services/convertionUtils');

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

// Función de comparación personalizada para ordenar por la clave 'iniciativaXXXX'
function compareIniciativaKeys(a, b) {
  const keyA = parseInt(a.replace("iniciativa", ""));
  const keyB = parseInt(b.replace("iniciativa", ""));

  return keyA - keyB;
}

function processTopologyInheritance(pageData) {
  const sortedKeys = Object.keys(pageData.lista_iniciativas).sort(compareIniciativaKeys);
  const data = [];

  for (const key of sortedKeys) {
    const iniciativa = pageData.lista_iniciativas[key];
    setTopology(iniciativa); // reset topology data
    if (current_supertype) iniciativa.supertype = current_supertype;
    if (current_type) iniciativa.type = current_type;
    if (current_subtype) iniciativa.subtype = current_subtype;
    if (current_subsubtype) iniciativa.subsubtype = current_subsubtype;

    data.push(iniciativa); //format initiative data
  }

  return data;
}

async function fetchInitiatives() {
    let totalResults = 0;
    let fetchedResults = 0;
    let page = 11167;
    let isFirstPage = false;
    let totalPages = 0;

    if(page == 1) isFirstPage = true;
    
    console.log(`Initiatives [Fetching]`);
    try {
      const pageData = await congressApi.getInitiatives(page);
      totalResults = pageData.iniciativas_encontradas;
      fetchedResults += pageData.paginacion.docs_fin;
  
      console.log('Initiatives -> total:', parseInt(totalResults));
      totalPages = Math.ceil(totalResults/25);
  
      let data = processTopologyInheritance(pageData);
  
      await saveData(data, isFirstPage); // Save the data after each page fetch
  
      while (fetchedResults < totalResults) {
        console.log('Initiatives -> Page:' + page + "/" + totalPages);
        page++;
        isFirstPage = false;

        const pageData = await congressApi.getInitiatives(page);
        let data = processTopologyInheritance(pageData);

        fetchedResults += pageData.paginacion.docs_fin;
        await saveData(data, isFirstPage);
      }
  
    } catch (error) {
      console.error(`Initiatives [ERROR]`, error);
      console.log(`Initiatives -> Last scrapped page:`, parseInt(page-1));
    }
    console.log(`Initiatives [Done]`);
}

async function fetchRepresentatives() {
  console.log(`Representatives [Fetching]`);
  let filters = { 
    _diputadomodule_idLegislatura: '0', 
    _diputadomodule_genero: '0', 
    _diputadomodule_grupo: 'all', 
    _diputadomodule_tipo: '2', 
    _diputadomodule_formacion: 'all', 
    _diputadomodule_filtroProvincias: '[]', 
    _diputadomodule_nombreCircunscripcion: ''
  };

  for (let i = 0; i < 15; i++) {
    filters._diputadomodule_idLegislatura = i.toString(); // Actualiza el valor de idLegislatura
    const response = await congressApi.getRepresentatives(filters);
    const representativesData = response.data;
    
    for (const representativeData of representativesData) {
      const rep = {
        surnames: representativeData.apellidos,
        name: representativeData.nombre,
        gender: representativeData.genero == 1 ? 'M' : 'F',
        profesion: '',
        legislatures: [],
      };

      const legislature = {
        legislature: representativeData.idLegislatura,
        representativeId: representativeData.codParlamentario,
        circunscripcion: representativeData.nombreCircunscripcion,
        party: representativeData.formacion,
        parliamentGroup: representativeData.grupo,
        startDate: representativeData.fchAlta,
        endDate: representativeData.fchBaja,
      };

      const newRepresentative = new Representative();
      const isNewRepresentative = await newRepresentative.saveRepresentative(rep, legislature);
      const legislatureName = (i === 0)? 'Constituyente' : convertionUtils.intToRoman(i);
      const legislatureInstance = new Legislature();
      await legislatureInstance.updateLegislatureComposition(legislatureName, representativeData.grupo, representativeData.formacion, isNewRepresentative);
    }
  }
  console.log(`Representatives [Done]`);
}

async function fetchLegislatures() {
  console.log(`Legislatures [Fetching]`);
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

    console.log('Legislatures -> total:', legislatures.length);

    const newLegislature = new Legislature();
    for (const legislature of legislatures) {
      await newLegislature.updateLegislature(legislature);
    }

    console.log(`Legislatures [Done]`);

  } catch (error) {
    console.error('Legislatures [ERROR]', error.message);
  }
};

module.exports = {
    fetchInitiatives,
    fetchLegislatures,
    fetchRepresentatives,
};
