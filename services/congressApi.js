const { request } = require('http');
const https = require('https');
const fs = require('fs').promises;
const axios = require('axios');

// Define the scrapping URL and method
const { urls, paths, docs, TOTAL_LEGISLATURES } = require('../config/congressApi');

const request_options = {
    hostname: urls.base,
    path: '',
    method: 'GET',
    headers: {
      'Cookie': '__cfduid=dce...d09; JSESSIONID=B8...350; acceptCookie=1;'
    }
};

// -------------------    Functions to exploit/utilize the congress API ---------------------------
async function getCookies() {
  try {
      const response = await axios.get(urls.https);
      const cookies = response.headers['set-cookie'];
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

async function getRepresentatives(filters = { _diputadomodule_idLegislatura: '14', _diputadomodule_genero: '0', _diputadomodule_grupo: 'all', _diputadomodule_tipo: '1', _diputadomodule_nombre: '', _diputadomodule_apellidos: '', _diputadomodule_formacion: 'all', _diputadomodule_filtroProvincias: '[]', _diputadomodule_nombreCircunscripcion: ''}) {
  // Obtiene cookies válidas
  const cookies = await getCookies();
  if (!cookies) {
      console.error('Representatives [Error]', 'not valid cookies retrieved');
      return;
  }

  //construye los encabezados de la solicitud
  const headers = setRequestHeaders(`${urls.https}${paths.representatives}`, cookies);

  // Construye el objeto formData con los filtros
  const formData = new URLSearchParams();
  for (const key in filters) {
      formData.append(key, filters[key]);
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

function apiRequest(request_options)
{
  return new Promise((resolve, reject) => {
    https.request(request_options, res => {
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

// by default fetches initiatives from ALL legislatures
function getInitiatives(page, filters = { _iniciativas_legislatura: 'C'}) { 
    // possible filters:  
    //_iniciativas_legislatura, _iniciativas_titulo, _iniciativas_texto, _iniciativas_autor, 
    //_iniciativas_competencias, _iniciativas_tipo, _iniciativas_tramitacion, _iniciativas_expedientes, 
    //_iniciativas_hasta, _iniciativas_tipo_tramitacion, _iniciativas_comision_competente, 
    //_iniciativas_fase, _iniciativas_organo, _iniciativas_fechaDe, _iniciativas_fechaDesde, 
    //_iniciativas_fechaHasta, _iniciativas_materias, _iniciativas_iniciativas_relacionadas, 
    //_iniciativas_iniciativas_origen, _iniciativas_iscc
    
    request_options.path = paths.initiatives;
    for (const key in filters){
        request_options.path += `&${key}=${filters[key]}`;
    }
    request_options.path += `&_iniciativas_paginaActual=${page}`;

    return apiRequest(request_options);
}

async function getLegislatures() {
  try {
    const response = await axios.get(`${urls.https}${paths.legislatures}`);
    return response;
  } catch (error) {
    console.error('Error al obtener las legislaturas desde la web del congreso:', error.message);
    throw error;
  }
};

// --------------- Useful custom functions ------------------------------------
function urlInitiative(idLegislature, idInitiative) {
    return `${urls.base}${paths.initiative}&_iniciativas_legislatura=${idLegislature}&_iniciativas_id=${idInitiative}`;
}

function urlRepresentativeProfile(idLegislature, idRepresentative){
    //idLegislature en num romanos
    return `${urls.base}${paths.representative}&codParlamentario=${idRepresentative}&idLegislatura=${idLegislature}`; 
}

function urlInitiativesList( page = 1){
  // other possible filters
  // &_iniciativas_titulo=&_iniciativas_texto=&_iniciativas_autor=&_iniciativas_competencias=&_iniciativas_tipo=&_iniciativas_tramitacion=&_iniciativas_expedientes=&_iniciativas_hasta=&_iniciativas_tipo_tramitacion=&_iniciativas_comision_competente=&_iniciativas_fase=&_iniciativas_organo=&_iniciativas_fechaDe=0&_iniciativas_fechaDesde=&_iniciativas_fechaHasta=&_iniciativas_materias=&_iniciativas_iniciativas_relacionadas=&_iniciativas_iniciativas_origen=&_iniciativas_iscc=
    return `${urls.base}${paths.initiatives}&_iniciativas_legislatura=C&_iniciativas_paginaActual=${page}`;
   }

//muestra la declaración de actividades legislatura actual solo
function urlDeclaracionActividadesDiputadoActualidad(idDiputado) {
    return `${urls.base}${docs.representative_interests}${idDiputado}.pdf`;
}

function iniciativasDiputado(idLegislatura, idDiputado){
    // idLegislatura en num romanos
    return `${urls.base}${paths.representative_initiatives}_iniciativas_codigo_diputado=${idDiputado}&_iniciativas_legislatura=${idLegislature}`;
}

module.exports = {
    urlInitiative,
    urlRepresentativeProfile,
    getInitiatives,
    getRepresentatives,
    getLegislatures,
};