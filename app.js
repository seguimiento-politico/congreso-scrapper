const mongoose = require('mongoose');
const scrapperController = require('./controllers/scrapperController');

async function main() {
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

main();

