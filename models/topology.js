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


topologySchema.methods.saveTopology = async function(data) {
  const existingTopology = await Topology.findOne({
    code: data.code
  });

  if (!existingTopology) {
    // Si la topología no existe, crear una nueva
    console.log("---------- Topología nueva ----------");
    console.log(data);
    try {
      await Topology.create(data);
    } catch (error) {
      if (error.code === 11000) {
        console.log(`La topología ${data.code} ya existe en la base de datos`);
      } else {
        console.error(`Error al guardar la topología ${data.code}: ${error.message}`);
      }
    }
  }
};

let Topology;
try {
  Topology = mongoose.model('Topology');
} catch (error) {
  Topology = mongoose.model('Topology', topologySchema);
}

module.exports = Topology;

