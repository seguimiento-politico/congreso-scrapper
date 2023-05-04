// URLs del Congreso de los diputados
const baseUrl = "www.congreso.es";

const urls = {
    base: baseUrl,
    https: "https://" + baseUrl,
    http: "http://" + baseUrl,
};

const paths = {
    initiatives: '/es/busqueda-de-iniciativas',
    initiative: '/es/busqueda-de-iniciativas?p_p_id=iniciativas&_iniciativas_mode=mostrarDetalle',
    representatives: '/es/busqueda-de-diputados?p_p_id=diputadomodule&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=searchDiputados&p_p_cacheability=cacheLevelPage',
    representative: '/es/busqueda-de-diputados?_diputadomodule_mostrarFicha=true',
    representative_initiatives: '/es/iniciativas-diputado?',
    terms: '/es/busqueda-de-iniciativas',
    groups: '/es/grupos/composicion-en-la-legislatura?p_p_id=grupos&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=gruposSearch&p_p_cacheability=cacheLevelPage',
    publications: '/es/busqueda-de-publicaciones',
    publication: '/es/busqueda-de-publicaciones?p_p_id=publicaciones&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&_publicaciones_mode=mostrarTextoIntegro'
};

const docs = {
    representative_interests: '/docinte/registro_intereses_diputado_',
    initiative_publication: '/public_oficiales/L14/CONG/DS/PL/DSCD-14-PL-1-C1.PDF'
};

module.exports = {
    urls,
    paths,
    docs
};