/* ---------- DEPENDENCIES ---------- */
const readline = require('readline');
const dbconfig = require('./config/database');

const Term = require('./models/term'); // Import the Term model
const scrapperController = require('./controllers/scrapperController');

let database;

switch (dbconfig.engine) {
  case 'mongodb':
    database = require('./services/mongoDB');
    break;
  case 'mysql':
    database = require('./services/MySQL');
    break;
  case 'postgresql':
    database = require('./services/postgresql');
    break;
  // Agrega más casos según los motores de bases de datos que desees utilizar
  default:
    throw new Error(`Unsupported database engine: ${dbconfig.engine}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function initialBasicScrapping() {
  try {
    await scrapperController.fetchTerms();
    await scrapperController.fetchParliamentGroups();
    await scrapperController.fetchRepresentatives();
    await scrapperController.fetchComissions();
    await scrapperController.fetchInitiatives(); //fetches initiatives and topology at the same time
  } catch (error) {
    console.error('Error in scrapperController', error);
  }
  
  process.exit(0); // Exit with a success code (0)
}

async function initialDetailedScrapping() {
  await scrapperController.fetchInitiativesContent();
  process.exit(0); // Exit with a success code (0)
}

async function OneTermBasicScrapping(term) {
  console.log('Basic Scrapping for term:', term);
  await scrapperController.fetchTerms();
  await scrapperController.fetchParliamentGroups({ term: term });
  await scrapperController.fetchRepresentatives({ term: term });
  await scrapperController.fetchComissions({ term: term });
  await scrapperController.fetchSubcomissions({ term: term });
  await scrapperController.fetchInitiatives({ term: term }); //fetches initiatives and topology at the same time
  process.exit(0); // Exit with a success code (0)
}

async function OneTermDetailedScrapping(term) {
  console.log('Detailed Scrapping for term:', term);
  await scrapperController.fetchInitiativesContent({ term: term });
  process.exit(0); // Exit with a success code (0)
}

async function requestTerm() {
  const terms = await Term.getAllTerms();
  
  const sortedTerms = terms.sort((a, b) => {
    return a.term - b.term;
  });
  
  const options = sortedTerms.map(l => `${l.term}`).join(', ');

  return new Promise((resolve) => {
    rl.question(`Ingrese la legislatura que desea actualizar (${options}): `, (term) => {
      resolve(term);
    });
  });
}


async function main() {
  await database.connect(); // Connect to database

  rl.question('Por favor, elija una opción:\n1. initial Basic Scrapping (all terms, pairlament composition and initiatives) \n2. initial Detailed Scrapping (all terms initiatives relevant data)\n3. One Term Basic Scrapping\n4. One Term Detailed Scrapping\n\nX. Salir\n', async (option) => {
    try {
      switch (option) {
        case '1':
          await initialBasicScrapping();
          break;
        case '2':
          await initialDetailedScrapping();
          break;
        case '3':
          term = await requestTerm();
          await OneTermBasicScrapping(term.toUpperCase());
          break;
        case '4':
          term = await requestTerm();
          await OneTermDetailedScrapping(term.toUpperCase());
          break;
        case 'x':
        case 'X':
          rl.close();
          break;
        default:
          console.log('Opción no válida. Por favor, elija 1, 2, 3, 4 o X.');
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

