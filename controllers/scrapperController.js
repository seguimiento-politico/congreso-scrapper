/* ---------- DEPENDENCIES ---------- */


/* ---------- MODELS ---------- */
const Initiative = require('../models/initiative');
const Term = require('../models/term');
const Topology = require('../models/topology');
const Representative = require('../models/representative');
const Comission = require('../models/comission');
const Group = require('../models/group');

/* ---------- INSTANCES ---------- */
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

    // Create initiative and topology instances
    const initiative = new Initiative();
    const topology = new Topology();

    while (page <= results.pages) {
      console.log('Initiatives -> Page:' + page + "/" + results.pages);

      for (const initiativeData of results.initiatives) {
        // Save the current initiative
        await initiative.saveInitiative(initiativeData);

        // Save the current topology in catalog
        await topology.saveTopology(initiativeData.topologyData);
      }

      // Move to the next page and fetch results
      page++;
      if (page <= results.pages) {
        results = await congressUtils.getInitiatives(page, filters);
      }
    }

  } catch (error) {
    console.error(`Initiatives [ERROR]`, error);
    console.log(`Initiatives -> Last scrapped page:`, parseInt(page - 1));
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

async function fetchComissions(filters = {}) {
  console.log(`Comissions [Fetching]`);

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

    const results = await congressUtils.scrapeComissions(filters);

    // loop every commission
    for (let x = 0; x < results.length; x++) {
      const commissionData = results[x];

      // Save commission in the Comission database
      await Comission.updateOne(
        { term: filters.term, code: commissionData.code },
        { $set: commissionData },
        { upsert: true }
      );
    }

    console.log(`Comissions -> term: ${i} - total: ${results.length} [Done]`);
  }
}

async function fetchBodyComposition(term = null, commissionCode = null) {
  console.log(`Body composition [Fetching]`);

  const comissions = await Comission.get(term, commissionCode);
  console.log(comissions);
  //loop every comission
  for (const comission of comissions) {
    // Fetch and save composition of the comission
    const commissionData = await congressUtils.getBodyComposition(comission.term, comission.code);
    await Comission.updateOne(
      { term: comission.term, code: comission.code },
      { $set: commissionData },
      { upsert: true }
    );
    console.log(`Body composition -> term: ${comission.term} - comission: ${comission.code} [Done]`);

    // Loop every subcomission within the current comission
    for (const subcomission of comission.subcomissions) {
      // Fetch and save composition of the subcomission
      const subcommissionData = await congressUtils.getBodyComposition(comission.term, comission.code, subcomission.code);
      await Comission.updateOne(
        { term: comission.term, code: comission.code, "subcomissions.code": subcomission.code },
        { $set: { "subcomissions.$": subcommissionData } },
        { upsert: true }
      );
      console.log(`Body composition -> term: ${comission.term} - comission: ${comission.code} - subcomission: ${subcomission.code} [Done]`);
    }
  }
}

async function fetchSubcomissions(filters = {}) {
  console.log(`Subcomissions [Fetching]`);

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

    const results = await congressUtils.scrapeSubcomissions(filters);

    // loop every subcommission
    for (let x = 0; x < results.length; x++) {
      const subcommissionData = results[x];

      // Save subcommission in the Comission database
      const commissionCode = subcommissionData.code.substring(0, 3);
      await Comission.updateOne(
        { term: filters.term, code: commissionCode, "subcomissions.code": { $ne: subcommissionData.code } },
        { $push: { subcomissions: subcommissionData } }
      );
    }

    console.log(`Subcomissions -> term: ${i} - total: ${results.length} [Done]`);
  }
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
      const groupInstance = new Group();
      await groupInstance.updateComposition(results.representatives_terms[x].term, results.representatives_terms[x].parliamentGroup, results.representatives_terms[x].party, isNewRepresentative);
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
      const groupInstance = new Group();
      await groupInstance.updateParliamentGroup(filters.term, results[x]);
    }
    console.log(`Parliament Groups -> term: ${i} - total: ${results.length} [Done]`);
  }
}

module.exports = {
    fetchInitiatives,
    fetchTerms,
    fetchRepresentatives,
    fetchParliamentGroups,
    fetchInitiativesContent,
    fetchComissions,
    fetchSubcomissions,
    fetchBodyComposition
};
