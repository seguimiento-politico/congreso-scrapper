const mongoose = require('mongoose');

const config = {
  connectionString: 'mongodb://127.0.0.1:27017/seguimiento-politico?directConnection=true&serverSelectionTimeoutMS=2000&appName=Congreso-scrapper v1',
  connectionOptions: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
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
