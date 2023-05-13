const dbconfig = require('../config/database');

let database;

switch (dbconfig.engine) {
  case 'mongodb':
    database = require('../services/mongoDB');
    break;
  case 'mysql':
    database = require('../services/MySQL');
    break;
  case 'postgresql':
    database = require('../services/postgresql');
    break;
  // Agrega más casos según los motores de bases de datos que desees utilizar
  default:
    throw new Error(`Unsupported database engine: ${dbconfig.engine}`);
}

module.exports = database ;