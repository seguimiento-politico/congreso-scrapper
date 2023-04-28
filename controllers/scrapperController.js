const cheerio = require('cheerio');
const axios = require('axios');

const Initiative = require('../models/initiative');
const Term = require('../models/term');
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
      term: (iniciativa.legislatura == 'C') ? '0' : convertionUtils.romanToInt(iniciativa.legislatura),
      initiativeId: iniciativa.id_iniciativa,
      initiativeType: iniciativa.id_iniciativa.split('/')[0],
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

async function fetchInitiatives(filters = {}) {
    let totalResults = 0;
    let fetchedResults = 0;
    let isFirstPage = false;
    let totalPages = 0;
    let page = 1;

    if(page == 1) isFirstPage = true;

    if (Object.keys(filters).length === 0) {
      filters.term = 'all';
    }

    console.log(`Initiatives [Fetching]`);
    try {
      const pageData = await congressApi.getInitiatives(page, filters);
      totalResults = pageData.iniciativas_encontradas;
      fetchedResults += pageData.paginacion.docs_fin;
  
      console.log('Initiatives -> total:', parseInt(totalResults));
      totalPages = Math.ceil(totalResults/25);
  
      let data = processTopologyInheritance(pageData);
  
      await saveData(data, isFirstPage); // Save the data after each page fetch
  
      while (page <= totalPages) {
        console.log('Initiatives -> Page:' + page + "/" + totalPages);
        page++;
        isFirstPage = false;

        const pageData = await congressApi.getInitiatives(page, filters);
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

async function fetchRepresentatives(filters = {}) {
  console.log(`Representatives [Fetching]`);
  
  if (Object.keys(filters).length === 0) {
    filters.term = 'all';
  }

  const totalTerms = (filters.term == 'all') ? 15 : 1;
  const startTerm = (totalTerms === 1) ? parseInt(filters.term) : 0;

  for (let i = startTerm; i < startTerm + totalTerms; i++) {
    if (totalTerms > 1) {
      filters.term = i.toString(); // Actualiza el valor de idLegislatura
    }

    const response = await congressApi.getRepresentatives(filters);
    const representativesData = response.data;
    
    for (const representativeData of representativesData) {
      const rep = {
        surnames: representativeData.apellidos,
        name: representativeData.nombre,
        gender: representativeData.genero == 1 ? 'M' : 'F',
        profesion: '',
        terms: [],
      };

      const term = {
        term: representativeData.idLegislatura,
        representativeId: representativeData.codParlamentario,
        circunscripcion: representativeData.nombreCircunscripcion,
        party: representativeData.formacion,
        parliamentGroup: representativeData.grupo,
        startDate: representativeData.fchAlta,
        endDate: representativeData.fchBaja,
      };

      const newRepresentative = new Representative();
      const isNewRepresentative = await newRepresentative.saveRepresentative(rep, term);
      const termName = (i === 0)? 'Constituyente' : convertionUtils.intToRoman(i);
      const termInstance = new Term();
      await termInstance.updateTermComposition(termName, representativeData.grupo, representativeData.formacion, isNewRepresentative);
    }
  }
  
  
  console.log(`Representatives [Done]`);
}

async function fetchTerms() {
  console.log(`Terms [Fetching]`);
  try {
    const response = await congressApi.getTerms();
    const $ = cheerio.load(response.data);

    const terms = [];
    const termOptions = $('#_iniciativas_legislatura option');

    termOptions.each((i, option) => {
      const termText = $(option).text().trim();
      let term = termText.substring(0, termText.indexOf("(")).trim().split(' ')[0];
      const datesText = termText.substring(termText.indexOf("(") + 1, termText.indexOf(")")).trim();
      const dates = datesText.split("-");
      const startDate = dates[0];
      const endDate = dates[1];
      
      if(term !== ""){
          if(term == "Legislatura") 
            term = '0';
          else 
            term = convertionUtils.romanToInt(term);

          terms.push({ term, startDate, endDate });
      }
      
    });

    console.log('Terms -> total:', terms.length);

    const newTerm = new Term();
    for (const term of terms) {
      await newTerm.updateTerm(term);
    }

    console.log(`Terms [Done]`);

  } catch (error) {
    console.error('Terms [ERROR]', error.message);
  }
};

module.exports = {
    fetchInitiatives,
    fetchTerms,
    fetchRepresentatives,
};
