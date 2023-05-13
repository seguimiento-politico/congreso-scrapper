/* ---------- DEPENDENCIES ---------- */
const readline = require('readline');

const Term = require('./models/term'); // Import the Term model
const scrapperController = require('./controllers/scrapperController');
const database = require('./controllers/databaseController');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function BasicScrapping(term) {
  console.log('Basic Scrapping for term:', term);
  await scrapperController.fetchTerms();
  await scrapperController.fetchParliamentGroups({ term: term });
  await scrapperController.fetchRepresentatives({ term: term });
  await scrapperController.fetchComissions({ term: term });
  await scrapperController.fetchSubcomissions({ term: term });
  await scrapperController.fetchBodyComposition(term);
  await scrapperController.fetchInitiatives({ term: term }); //fetches initiatives and topology at the same time
  process.exit(0); // Exit with a success code (0)
}

async function DetailedScrapping(term) {
  console.log('Detailed Scrapping for term:', term);
  await scrapperController.fetchInitiativesContent({ term: term });
  process.exit(0); // Exit with a success code (0)
}

async function CompleteScrapping(term) {
  console.log('Complete Scrapping for term:', term);
  await BasicScrapping(term);
  await DetailedScrapping(term);
  process.exit(0); // Exit with a success code (0)
}

async function requestTerm() {
  const terms = await Term.getAllTerms();
  
  const sortedTerms = terms.sort((a, b) => {
    return a.term - b.term;
  });
  
  let options = sortedTerms.map(l => `${l.term}`).join(', ');

  // Add 'ALL' to options
  options += ', ALL';

  return new Promise((resolve) => {
    rl.question(`Ingrese la legislatura que desea actualizar (${options}): `, (term) => {
      resolve(term);
    });
  });
}

async function main() {
  await database.connect(); // Connect to database

  rl.question('Por favor, elija una opción:\n1. Basic Scrapping \n2. Detailed Scrapping\n3. Complete (Basic + Detailed) Scrapping\n\nX. Salir\n', async (option) => {
    try {
      let term;
      switch (option) {
        case '1':
          term = await requestTerm();
          term = term.toUpperCase();
          if (term === 'ALL') {
            const terms = await Term.getAllTerms();
            for (let t of terms) {
              await BasicScrapping(t.term);
            }
          } else {
            await BasicScrapping(term);
          }
          break;
        case '2':
          term = await requestTerm();
          term = term.toUpperCase();
          if (term === 'ALL') {
            const terms = await Term.getAllTerms();
            for (let t of terms) {
              await DetailedScrapping(t.term);
            }
          } else {
            await DetailedScrapping(term);
          }
          break;
        case '3':
          term = await requestTerm();
          term = term.toUpperCase();
          if (term === 'ALL') {
            const terms = await Term.getAllTerms();
            for (let t of terms) {
              await CompleteScrapping(t.term);
            }
          } else {
            await CompleteScrapping(term);
          }
          break;
        case 'x':
        case 'X':
          rl.close();
          break;
        default:
          console.log('Opción no válida. Por favor, elija 1, 2, 3 o X.');
          break;
      }
    } catch (error) {
      console.error('Error en la opción seleccionada', error);
    } finally {
      await database.disconnect(); // Disconnect from database
      process.exit(0); // Exit with a success code (0)
    }
  });
}

main();



