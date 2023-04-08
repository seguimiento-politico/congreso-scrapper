const mongoose = require('mongoose');

const topologySchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  supertype: String,
  type: String,
  subtype: String,
  subsubtype: String
});

let Topology;
try {
  Topology = mongoose.model('Topology');
} catch (error) {
  Topology = mongoose.model('Topology', topologySchema);
}

module.exports = Topology;
