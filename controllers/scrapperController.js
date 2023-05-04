const Initiative = require('../models/initiative');
const Term = require('../models/term');
const Topology = require('../models/topology');
const Representative = require('../models/representative');

const congressUtils = require('../services/congressUtils');

//iniciativas
async function fetchInitiatives(filters = {}) {
    let page = 1;

    if (Object.keys(filters).length === 0) {
      filters.term = 'all';
    }

    console.log(`Initiatives [Fetching]`);
    try {
      let results = await congressUtils.getInitiatives(page, filters);
      console.log('Initiatives -> total:', parseInt(results.items));

      //save initiatives
      const initiative = new Initiative(results.initiativeData);
      await initiative.saveInitiative(results.initiativeData);

      //save topology in catalog
      const topology = new Topology(results.topologyData);
      await topology.saveTopology(results.topologyData);

      while (page <= results.pages) {
        console.log('Initiatives -> Page:' + page + "/" + results.pages);
        page++;

        results = await congressUtils.getInitiatives(page, filters);
        
        //save initiatives
        const initiative = new Initiative(results.initiativeData);
        await initiative.saveInitiative(results.initiativeData);

        //save topology in catalog
        const topology = new Topology(results.topologyData);
        await topology.saveTopology(results.topologyData);
      }
  
    } catch (error) {
      console.error(`Initiatives [ERROR]`, error);
      console.log(`Initiatives -> Last scrapped page:`, parseInt(page-1));
    }
    console.log(`Initiatives [Done]`);
}

//contenido de las iniciativas
async function fetchInitiativesContent(filters = {}) {
  console.log(`Initiatives content [Fetching]`);

  try {
    const initiatives = await Initiative.getInitiatives(filters);
    const results = congressUtils.generateInitiativesURLs(initiatives);
    
    for (const element of results) {
      let initiativeData = await congressUtils.scrapeInitiative(element.term, element.initiativeId, element.url);
      //update initiatives
      const initiative = new Initiative(initiativeData);
      await initiative.updateInitiative(initiativeData);
    }

  } catch (error) {
    console.error(`Error retrieving initiative IDs for term ${term}: `, error.message);
  }

  console.log(`Initiatives [Done]`);
}

//diputados
async function fetchRepresentatives(filters = {}) {
  console.log(`Representatives [Fetching]`);
  
  if (Object.keys(filters).length === 0) {
    filters.term = 'all';
  }

  const allTerms = await Term.getAllTerms();
  const totalTerms = (filters.term == 'all') ? allTerms.length : 1;
  const startTerm = (totalTerms === 1) ? parseInt(filters.term) : 0;

  //loop every term
  for (let i = startTerm; i < startTerm + totalTerms; i++) {
    if (totalTerms > 1) {
      filters.term = i.toString(); // Actualiza el valor de idLegislatura
    }

    const results = await congressUtils.getRepresentatives(filters);
    // loop every representative
    for (let x = 0; x < results.representatives.length; x++) {
      const newRepresentative = new Representative();
      const isNewRepresentative = await newRepresentative.saveRepresentative(results.representatives[x], results.representatives_terms[x]);
      const termInstance = new Term();
      await termInstance.updateTermComposition(results.representatives_terms[x].term, results.representatives_terms[x].parliamentGroup, results.representatives_terms[x].party, isNewRepresentative);
    } 
  
  console.log(`Representatives -> term: ${i} - total: ${results.representatives.length} [Done]`);
  }  
}

//legislaturas
async function fetchTerms() {
  console.log(`Terms [Fetching]`);
  try {
    const terms = await congressUtils.getTerms(); 

    const newTerm = new Term();
    for (const term of terms) {
      await newTerm.updateTerm(term);
    }

    console.log(`Terms -> total: ${terms.length} [Done]`);

  } catch (error) {
    console.error('Terms [ERROR]', error.message);
  }
};

// grupos parlamentarios
async function fetchParliamentGroups(filters = {}) {
  if (Object.keys(filters).length === 0) {
    filters.term = 'all';
  }
  console.log(`Parliament Groups [Fetching]`);
  
  const allTerms = await Term.getAllTerms();
  const totalTerms = (filters.term == 'all') ? allTerms.length : 1;
  const startTerm = (totalTerms === 1) ? parseInt(filters.term) : 0;

  //loop every term
  for (let i = startTerm; i < startTerm + totalTerms; i++) {
    if (totalTerms > 1) {
      filters.term = i.toString(); // Actualiza el valor de Legislatura
    }

    const results = await congressUtils.getParliamentGroups(filters);

    // loop every group
    for (let x = 0; x < results.length; x++) {
      const termInstance = new Term();
      await termInstance.updateTermParliamentGroup(filters.term, results[x]);
    }
    console.log(`Parliament Groups -> term: ${i} - total: ${results.length} [Done]`);
  } 

}
module.exports = {
    fetchInitiatives,
    fetchTerms,
    fetchRepresentatives,
    fetchParliamentGroups,
    fetchInitiativesContent
};
