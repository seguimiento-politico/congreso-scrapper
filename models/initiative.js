const mongoose = require('mongoose');

const initiativeSchema = new mongoose.Schema({
  term: String,
  initiativeId: String,
  initiativeType: String,
  title: String,
  presentedDate: String,
  qualifiedDate: String,
  dossierUrls: [String],
  author: [String],
  status: String,
  result: String,
  tramitationType: String,
  competentCommissions: [
    {
      name: String,
      code: String,
      subBodyId: String
    }
  ],
  parlamentaryCodes: [String],
  initiativeTramitation: [
    {
      name: String,
      startDate: String,
      endDate: String
    }
  ],
  bulletins: [
    {
      text: String,
      urls: [String]
    }
  ],
  diaries: [
    {
      text: String,
      urlText: String,
      urlPDF: String
    }
  ],
  boes: [
    {
      text: String,
      url: String
    }
  ]
});

//crea o actualiza los campos básicos de las iniciativas dadas
initiativeSchema.methods.saveInitiative = async function(data) {
  const existingInitiative = await Initiative.findOne({
    initiativeId: data.initiativeId,
    term: data.term,
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

//actualiza el contenido de una iniciativa dada
initiativeSchema.methods.updateInitiative = async function (data) {
  try {
    const updatedFields = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined || value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {});

    await Initiative.findOneAndUpdate(
      { term: data.term, initiativeId: data.initiativeId },
      { $set: updatedFields }
    );
  } catch (error) {
    console.error(`Error al actualizar la iniciativa: ${error.message}`);
  }
};


initiativeSchema.statics.getInitiatives = async function (filters) {
  try {
    const initiatives = await this.find(filters);
    return initiatives;
  } catch (error) {
    console.error(`Error retrieving initiatives for filters ${filters}: `, error.message);
  }
}

let Initiative;
try {
  Initiative = mongoose.model('Initiative');
} catch (error) {
  Initiative = mongoose.model('Initiative', initiativeSchema);
}

module.exports = Initiative;
