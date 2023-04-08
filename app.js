const mongoose = require('mongoose');
const scrapperController = require('./controllers/scrapperController');

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://127.0.0.1:27017/seguimiento-politico?directConnection=true&serverSelectionTimeoutMS=2000&appName=Congreso-scrapper v1', { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB', error);
  }

  try {
    await scrapperController.fetchLegislatures();
    await scrapperController.fetchALLInitiativesData();
  } catch (error) {
    console.error('Error in scrapperController', error);
  }

  try {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error disconnecting from MongoDB', error);
  }
  
  process.exit(0); // Exit with a success code (0)
}

main();

