const { request } = require('http');
const https = require('https');
const fs = require('fs').promises;
const axios = require('axios');

// Define the scrapping URL and method
const { urls, paths, docs, TOTAL_TERMS } = require('../config/congressApi');

// Variable global para almacenar las cookies
let storedCookies = null;

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
      return response.data;
    } else {
      console.log('Initiatives [ERROR]', 'Error en la solicitud');
    }
  } catch (error) {
    console.error('Initiatives [ERROR]', error);
  }
}

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
          return response.data;
      } else {
          console.log('Representative [ERROR]', 'Error en la solicitud');
      }
  } catch (error) {
      console.error('Representative [ERROR]', error);
  }
}

async function getTerms() {
  try {
    const response = await axios.get(`${urls.https}${paths.terms}`);
    return response;
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