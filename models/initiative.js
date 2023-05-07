const mongoose = require('mongoose');

const autorSchema = new mongoose.Schema({
  type: String,
  id: String,
  name: String
});

const initiativeSchema = new mongoose.Schema({
  term: String,
  initiativeId: String,
  initiativeType: String,
  title: String,
  presentedDate: String,
  qualifiedDate: String,
  dossierUrls: [String],
  author: [autorSchema],
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

//filtra datos vacíos para evitar guardarlos en la base de datos
// por razones que desconozco no funciona con los arrays [TODO] [PENDING]
initiativeSchema.pre("save", function (next) {
  const doc = this.toObject();

  const isValidValue = (value) => {
    if (value === null || value === undefined) {
      return false;
    }

    if (Array.isArray(value) && value.length === 0) {
      return false;
    }

    return true;
  };

  const filteredDoc = Object.fromEntries(
    Object.entries(doc).filter(([key, value]) => isValidValue(value))
  );

  // Set the keys with empty arrays as undefined
  for (const key in doc) {
    if (!isValidValue(doc[key])) {
      this[key] = undefined;
    }
  }

  Object.assign(this, filteredDoc);
  next();
});


//crea o actualiza los campos básicos de las iniciativas dadas
initiativeSchema.methods.saveInitiative = async function(data) {
  const existingInitiative = await Initiative.findOne({
    initiativeId: data.initiativeId,
    term: data.term,
  });
  
  if (existingInitiative) {
    // will only update the initiative in case of endDate or result change; the rest is ignored.
    if (existingInitiative.qualifiedDate !== data.qualifiedDate || existingInitiative.result !== data.result) {
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
