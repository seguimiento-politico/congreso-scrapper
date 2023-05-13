/* ------------ URLs del Congreso de los diputados ------------ */
const baseUrl = "www.congreso.es";
const urls = {
    base: baseUrl,
    https: "https://" + baseUrl,
    http: "http://" + baseUrl,
};

/* ------------- congreso.es API endPoints (JSON data) ------------ */
const endPoints = {
    initiatives: {
        path: '/es/busqueda-de-iniciativas',
        params: {
            p_p_id: 'iniciativas',
            p_p_lifecycle: '2',
            p_p_resource_id: 'filtrarListado',
            p_p_cacheability: 'cacheLevelPage',
            _iniciativas_legislatura: '',
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
            _iniciativas_iscc: '',
            _iniciativas_paginaActual: ''
        }
    },
    initiative: {
        path: '/es/busqueda-de-iniciativas',
        params: {
            p_p_id: 'iniciativas',
            _iniciativas_mode: 'mostrarDetalle',
            _iniciativas_legislatura: '',
            _iniciativas_id: ''
        }
    },
    representatives: {
        path: '/es/busqueda-de-diputados',
        params: {
            p_p_id: 'diputadomodule',
            p_p_lifecycle: '2',
            p_p_state: 'normal',
            p_p_mode: 'view',
            p_p_resource_id: 'searchDiputados',
            p_p_cacheability: 'cacheLevelPage',
            _diputadomodule_idLegislatura: '',
            _diputadomodule_genero: '', 
            _diputadomodule_grupo: '', 
            _diputadomodule_tipo: '',
            _diputadomodule_formacion: '', 
            _diputadomodule_filtroProvincias: '', 
            _diputadomodule_nombreCircunscripcion: '',
        }
    },
    representative: {
        path: '/es/busqueda-de-diputados',
        params: {
            _diputadomodule_mostrarFicha: 'true',
        }
    },
    representative_initiatives: {
        path: '/es/iniciativas-diputado',
        params: {

        }
    },
    groups: {
        path: '/es/grupos/composicion-en-la-legislatura',
        params: {
            p_p_id: 'grupos',
            p_p_lifecycle: '2',
            p_p_state: 'normal',
            p_p_mode: 'view',
            p_p_resource_id: 'gruposSearch',
            p_p_cacheability: 'cacheLevelPage'
        }
    },
    publications: {
        path: '/es/busqueda-de-publicaciones',
        params: {

        }
    },
    publication: {
        path: '/es/busqueda-de-publicaciones',
        params: {
            p_p_id: 'publicaciones',
            p_p_lifecycle: '0', 
            p_p_state: 'normal', 
            p_p_mode: 'view', 
            _publicaciones_mode: 'mostrarTextoIntegro',
        }
    },
    comissions: {
        path: '/es/comisiones',
        params: {

        }
    },
    comission_composition: {
        path: '/es/organos/composicion-en-la-legislatura',
        method: 'POST',
        params: {
            p_p_id: 'organos', 
            p_p_lifecycle: '2', 
            p_p_state: 'normal', 
            p_p_mode: 'view', 
            p_p_resource_id: 'searchOrgano',
            _organos_selectedOrganoSup: '1',
            _organos_selectedLegislatura: '', // num romanos
            _organos_compoHistorica: "true",
            _organos_selectedSuborgano: '' 
        }
    },
    subcomissions: {
        path: '/es/subcomisiones-y-ponencias',
        params: {

        }
    },
    subcomission_composition: {
        path: '/es/organos/composicion-en-la-legislatura',
        params: {
            p_p_id: 'organos',
            p_p_lifecycle: '2', 
            p_p_state: 'normal', 
            p_p_mode: 'view', 
            p_p_resource_id: 'searchOrgano', 
            _organos_selectedLegislatura: '', // num romanos
            _organos_selectedOrganoSup: '', 
            _organos_compoHistorica: "true",
            _organos_selectedSuborgano: ''
        }
    },            
};       

/* ------------- congreso.es pages with relevant info not accesible by API (HTML data) ----------- */
const pages = {

};

const docs = {
    representative_interests: '/docinte/registro_intereses_diputado_',
    initiative_publication: '/public_oficiales/L14/CONG/DS/PL/DSCD-14-PL-1-C1.PDF'
};

module.exports = {
    urls,
    endPoints,
    pages,
    docs
};