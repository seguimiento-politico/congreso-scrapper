const mongoose = require('mongoose');
const readline = require('readline');

const scrapperController = require('./controllers/scrapperController');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function initialBasicScrapping() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://127.0.0.1:27017/seguimiento-politico?directConnection=true&serverSelectionTimeoutMS=2000&appName=Congreso-scrapper v1', { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB [Connected]');
  } catch (error) {
    console.error('MongoDB [connection error]', error);
  }

  try {
    await scrapperController.fetchLegislatures();
    await scrapperController.fetchRepresentatives();
    await scrapperController.fetchInitiatives(); //fetches initiatives and topology at the same time
  } catch (error) {
    console.error('Error in scrapperController', error);
  }

  try {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log('MongoDB [Disconnected]');
  } catch (error) {
    console.error('MongoDB [disconnection error]', error);
  }
  
  process.exit(0); // Exit with a success code (0)
}

async function initialDetailedScrapping() {
  process.exit(0); // Exit with a success code (0)
}

async function OneLegislatureBasicScrapping() {
  process.exit(0); // Exit with a success code (0)
}

async function OneLegislatureDetailedScrapping() {
  process.exit(0); // Exit with a success code (0)
}

async function main() {
  rl.question('Por favor, elija una opción:\n1. initial Basic Scrapping (all legislatures, pairlament composition and initiatives) \n2. initial Detailed Scrapping (all legislatures initiatives relevant data)\n3. One Legislature Basic Scrapping\n4. One Legislature Detailed Scrapping\n\nX. Salir\n', async (option) => {
    switch (option) {
      case '1':
        await initialBasicScrapping();
        break;
      case '2':
        await initialDetailedScrapping();
        break;
      case '3':
        await OneLegislatureBasicScrapping();
        break;
      case '4':
        await OneLegislatureDetailedScrapping();
        break;
      case 'x':
      case 'X':
        rl.close();
        break;
      default:
        console.log('Opción no válida. Por favor, elija 1, 2, 3, 4 o X.');
        break;
    }
  });
}

main();

