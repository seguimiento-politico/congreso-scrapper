/* ---------- DEPENDENCIES ---------- */
const mongoose = require('mongoose');

/* ---------- CONFIGURATION ---------- */
const dbconfig = require('../config/database.js');

const config = {
  connectionString: `mongodb://${dbconfig.host}:${dbconfig.port}/${dbconfig.name}`,
  connectionOptions: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    directConnection: true,
    serverSelectionTimeoutMS: 2000, 
    appName: 'Congreso-scrapper',
  },
};

async function connect() {
  try {
    await mongoose.connect(config.connectionString, config.connectionOptions);
    console.log('MongoDB [Connected]');
  } catch (error) {
    console.error('MongoDB [connection error]', error);
  }
}

async function disconnect() {
  try {
    await mongoose.disconnect();
    console.log('MongoDB [Disconnected]');
  } catch (error) {
    console.error('MongoDB [disconnection error]', error);
  }
}

module.exports = {
  connect,
  disconnect,
};
