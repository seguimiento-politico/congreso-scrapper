const https = require('https');
const mongoose = require('mongoose');
const scrapperController = require('./controllers/scrapperController');

async function main() {
  // Connect to MongoDB
  mongoose.connect('mongodb://127.0.0.1:27017/seguimiento-politico?directConnection=true&serverSelectionTimeoutMS=2000&appName=Congreso-scrapper v1', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(error => console.log(error));

    await scrapperController.fetchLegislatures();
    await scrapperController.fetchALLInitiativesData();
}

main();
