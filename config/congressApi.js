// URLs del Congreso de los diputados
const baseUrl = "www.congreso.es";

const urls = {
    base: baseUrl,
    https: "https://" + baseUrl,
    http: "http://" + baseUrl,
};

const paths = {
    initiatives: '/es/busqueda-de-iniciativas?p_p_id=iniciativas&p_p_lifecycle=2&p_p_resource_id=filtrarListado&p_p_cacheability=cacheLevelPage',
    initiative: '/es/busqueda-de-iniciativas?p_p_id=iniciativas&_iniciativas_mode=mostrarDetalle',
    representatives: '/es/busqueda-de-diputados?p_p_id=diputadomodule&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=searchDiputados&p_p_cacheability=cacheLevelPage',
    representative: '/es/busqueda-de-diputados?_diputadomodule_mostrarFicha=true',
    representative_initiatives: '/es/iniciativas-diputado?',
    terms: '/es/busqueda-de-iniciativas',
};

const docs = {
    representative_interests: '/docinte/registro_intereses_diputado_',
};

const TOTAL_TERMS = 15;

module.exports = {
    urls,
    paths,
    docs,
    TOTAL_TERMS,
};