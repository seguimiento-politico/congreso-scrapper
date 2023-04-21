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

function apiRequest (request_options)
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
function fetchInitiatives(page, filters = { _iniciativas_legislatura: 'C'}) { 
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

function fetchRepresentatives(page, filters = { _iniciativas_legislatura: '14', _diputadomodule_formacion: 'all', _diputadomodule_formacion: '-1'}) {
    // possible filters: 
    //_iniciativas_legislatura, _diputadomodule_genero, _diputadomodule_grupo, _diputadomodule_tipo
    // _diputadomodule_nombre, _diputadomodule_apellidos, _diputadomodule_formacion, 
    // _diputadomodule_filtroProvincias, _diputadomodule_nombreCircunscripcion
    request_options.path = paths.representatives;
    
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
    fetchInitiatives,
    fetchRepresentatives,
    getLegislatures,
};