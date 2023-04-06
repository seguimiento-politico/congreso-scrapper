const mongoose = require('mongoose');

const topologySchema = new mongoose.Schema({
  code: String,
  superType: String,
  Type: String,
  subType: String,
  subSubType: String
});

let Topology;
try {
  Topology = mongoose.model('Topology');
} catch (error) {
  Topology = mongoose.model('Topology', topologySchema);
}

module.exports = Topology;
