const { request } = require('http');
const https = require('https');
const fs = require('fs').promises;
const axios = require('axios');
const cheerio = require('cheerio');

// Define the scrapping URL and method
const { urls, paths, docs } = require('../config/congressApi');
const convertionUtils = require('./convertionUtils');

// Variable global para almacenar las cookies
let storedCookies = null;

//Topology data to be inherited
let current_supertype = null;
let current_type = null;
let current_subtype = null;
let current_subsubtype = null;


////////////////////////////////////////////////////////////////////
// ----------- Functions to transform datasets ---------------------

function transformRepresentativesData(data) {

  let representatives = [];
  let representatives_terms = [];

  for (const representativeData of data) {
    const rep = {
      surnames: representativeData.apellidos,
      name: representativeData.nombre,
      gender: representativeData.genero == 1 ? 'M' : 'F',
      profesion: '',
      terms: [],
    };
    representatives.push(rep);

    const term = {
      term: representativeData.idLegislatura,
      representativeId: representativeData.codParlamentario,
      circunscripcion: representativeData.nombreCircunscripcion,
      party: representativeData.formacion,
      parliamentGroup: representativeData.grupo,
      startDate: representativeData.fchAlta,
      endDate: representativeData.fchBaja,
    };
    representatives_terms.push(term);

    }

    return { representatives, representatives_terms };
}


function transformInitiativeData(data) {
  const initiativesArray = Object.values(data);
  const simplifiedData = initiativesArray.map(iniciativa => {
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
  return simplifiedData;
}

// Función de comparación personalizada para ordenar por la clave 'iniciativaXXXX'
function compareIniciativaKeys(a, b) {
  const keyA = parseInt(a.replace("iniciativa", ""));
  const keyB = parseInt(b.replace("iniciativa", ""));

  return keyA - keyB;
}

function processTopologyInheritance(initiatives) {
  const sortedKeys = Object.keys(initiatives).sort(compareIniciativaKeys);
  const data = [];

  for (const key of sortedKeys) {
    const iniciativa = initiatives[key];
    
    // Set topology data to be inherited
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

    //assign topology to initiative
    if (current_supertype) iniciativa.supertype = current_supertype;
    if (current_type) iniciativa.type = current_type;
    if (current_subtype) iniciativa.subtype = current_subtype;
    if (current_subsubtype) iniciativa.subsubtype = current_subsubtype;

    data.push(iniciativa); //format initiative data
  }

  return data;
}

function transformTopologyData(data) {
  const topologiesArray = Object.values(data);
  const simplifiedData = topologiesArray.map(iniciativa => {
    const newItem = {
      code: iniciativa.id_iniciativa.split('/')[0],
      supertype: iniciativa.supertype
    };

    if (iniciativa.type) newItem.type = iniciativa.type;
    if (iniciativa.subtype) newItem.subtype = iniciativa.subtype;
    if (iniciativa.subsubtype) newItem.subsubtype = iniciativa.subsubtype;

    return newItem;
  });
  return simplifiedData;
}

function transformTermData(data) {

}

////////////////////////////////////////////////////////////////////////////////////////////////////
// -------------------    Functions to exploit/utilize the congress API ---------------------------
async function getCookies() {
  if (storedCookies) {
    return storedCookies;
  }

  try {
      const response = await axios.get(urls.https);
      const cookies = response.headers['set-cookie'];
      storedCookies = cookies;
      return cookies;
  } catch (error) {
      console.error('Error al obtener las cookies:', error);
      return null;
  }
}

function setRequestHeaders(referer, cookies) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/112.0',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
    'Origin': urls.https,
    'DNT': '1',
    'Referer': referer,
    'Cookie': cookies,
  };
  return headers;
}

//iniciativas
async function getInitiatives(page, filters = {}) {
  let defaultFilters = {
    term: 'all', // todas las legislaturas 'C'
    title: '',
    text: '',
    author: '',
    topology: '',
    type: '',
    processing: '',
    processing_type: '',
    expedient: '',
    until: '',
    comission: '',
    phase: '',
    body: '',
    from: '',
    to: '',
    topic: '',
    related: '',
    origin: '',
    iscc: '',
  };

  // Mezcla los filtros proporcionados con los predeterminados
  const appliedFilters = { ...defaultFilters, ...filters };

  // Form params to send as form data
  let formParams = {
    p_p_id: 'iniciativas',
    p_p_lifecycle: '2',
    p_p_resource_id: 'filtrarListado',
    p_p_cacheability: 'cacheLevelPage',
    _iniciativas_legislatura: (appliedFilters.term == 'all') ? 'C' : appliedFilters.term,
    _iniciativas_titulo: '',
    _iniciativas_texto: '',
    _iniciativas_autor: '',
    _iniciativas_competencias: '',
    _iniciativas_tipo: '',
    _iniciativas_tramitacion: '',
    _iniciativas_expedientes: '',
    _iniciativas_hasta: '',
    _iniciativas_tipo_tramitacion: '',
    _iniciativas_comision_competente: '',
    _iniciativas_fase: '',
    _iniciativas_organo: '',
    _iniciativas_fechaDe: '0',
    _iniciativas_fechaDesde: '',
    _iniciativas_fechaHasta: '',
    _iniciativas_materias: '',
    _iniciativas_iniciativas_relacionadas: '',
    _iniciativas_iniciativas_origen: '',
    _iniciativas_iscc: ''
  };
  
  // Construye el objeto URLSearchParams con los parámetros de consulta
  const queryParams = new URLSearchParams();
  for (const key in formParams) {
    queryParams.append(key, formParams[key]);
  }
  queryParams.append('_iniciativas_paginaActual', page);

  // Obtiene cookies válidas
  const cookies = await getCookies();
  if (!cookies) {
    console.error('Initiatives [Error]', 'not valid cookies retrieved');
    return;
  }

  // Construye los encabezados de la solicitud
  const headers = setRequestHeaders(`${urls.https}${paths.initiatives}`, cookies);

  // Configura la solicitud de Axios
  const config = {
    method: 'get',
    url: `${urls.https}${paths.initiatives}?${queryParams.toString()}`,
    headers: headers
  };

  try {
    const response = await axios(config);
    if (response.status === 200) {
      let items = response.data.iniciativas_encontradas;
      let pages = Math.ceil(items/25); 
      let data = processTopologyInheritance(response.data.lista_iniciativas);
      let initiativeData = transformInitiativeData(data);
      let topologyData = transformTopologyData(data);

      return { items, pages, initiativeData, topologyData };
    } else {
      console.error('Initiatives [ERROR]', 'Error en la solicitud');
    }
  } catch (error) {
    console.error('Initiatives [ERROR]', error);
  }
}

//diputados
async function getRepresentatives(filters = {}) {
  // Obtiene cookies válidas
  const cookies = await getCookies();
  if (!cookies) {
      console.error('Representatives [Error]', 'not valid cookies retrieved');
      return;
  }
  //construye los encabezados de la solicitud
  const headers = setRequestHeaders(`${urls.https}${paths.representatives}`, cookies);

  let defaultFilters = {
    term: 'all',
    gender: 'all', //1 = Male; 0 = Female
    group: 'all', 
    type: 'all', // 1 = active; 0 = inactive ???
    party: 'all',
    provinces: 'all',
    circunscripcion: 'all' // for any [name1,name2]
  };

  // Mezcla los filtros proporcionados con los predeterminados
  const appliedFilters = { ...defaultFilters, ...filters };
  
  // Form params to send as form data
  let formParams = { 
    _diputadomodule_idLegislatura: (appliedFilters.term == 'all') ? '-1' : appliedFilters.term,
    _diputadomodule_genero: (appliedFilters.gender == 'all') ? '0' : (appliedFilters.gender == '1') ? 'M' : 'F', 
    _diputadomodule_grupo: appliedFilters.group, 
    _diputadomodule_tipo: (appliedFilters.type == 'all') ? '2' : appliedFilters.type,
    _diputadomodule_formacion: appliedFilters.party, 
    _diputadomodule_filtroProvincias: (appliedFilters.provinces == 'all') ? '[]' : appliedFilters.provinces, 
    _diputadomodule_nombreCircunscripcion: (appliedFilters.circunscripcion == 'all') ? '' : appliedFilters.circunscripcion,
  };

  // Construye el objeto formData con los filtros
  const formData = new URLSearchParams();
  for (const key in formParams) {
      formData.append(key, formParams[key]);
  }
  
  const config = {
      method: 'post',
      url: `${urls.https}${paths.representatives}`,
      headers: headers,
      data: formData,
  };

  try {
      const response = await axios(config);
      if (response.status === 200) {
          let results = transformRepresentativesData(response.data.data);
          return results;
      } else {
          console.error('Representative [ERROR]', 'Error en la solicitud');
      }
  } catch (error) {
      console.error('Representative [ERROR]', error);
  }
}

//legislaturas
async function getTerms() {
  try {
    const response = await axios.get(`${urls.https}${paths.terms}`);

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

    return terms;

  } catch (error) {
    console.error('Error al obtener las legislaturas desde la web del congreso:', error.message);
    throw error;
  }
};

module.exports = {
    getInitiatives,
    getRepresentatives,
    getTerms,
};