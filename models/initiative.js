const mongoose = require('mongoose');

const initiativeSchema = new mongoose.Schema({
  legislature: String,
  initiativeId: String,
  title: String,
  startDate: String,
  endDate: String,
  author: String,
  result: String
});

initiativeSchema.methods.saveInitiative = async function(data) {
  const existingInitiative = await Initiative.findOne({
    initiativeId: data.initiativeId,
    legislature: data.legislature,
  });

  if (existingInitiative) {
    // will only update the initiative in case of endDate or result change; the rest is ignored.
    if (existingInitiative.endDate !== data.endDate || existingInitiative.result !== data.result) {
      console.log("----------  Actualizada iniciativa --------------");
      console.log("iniciativa original:");
      console.log(existingInitiative);
      console.log("iniciativa nueva:");
      console.log(data);
      Object.assign(existingInitiative, data);
      await existingInitiative.save();
    }
  } else {
    await Initiative.create(data);
  }
};

let Initiative;
try {
  Initiative = mongoose.model('Initiative');
} catch (error) {
  Initiative = mongoose.model('Initiative', initiativeSchema);
}

module.exports = Initiative;
