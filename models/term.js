const mongoose = require('mongoose');

const partiesSchema = new mongoose.Schema({
  name: String,
  code: String,
  representativeCount: { type: Number, default: 0 }
});

const parliamentGroupSchema = new mongoose.Schema({
  name: String,
  groupId: String,
  seats: String,
  parties: [partiesSchema],
  representativeCount: { type: Number, default: 0 }
});

const termSchema = new mongoose.Schema({
  term: String,
  startDate: String,
  endDate: String,
  parliamentGroups: [parliamentGroupSchema]
});

termSchema.methods.updateTerm = async function(termData) {
  const existingTerm = await Term.findOne({ term: termData.term });
  if (existingTerm) {
    if (existingTerm.startDate !== termData.startDate || existingTerm.endDate !== termData.endDate) {
      Object.assign(existingTerm, termData);
      await existingTerm.save();
      console.log(`Updated ${existingTerm.term} term`);
    }
  } else {
    await Term.create(termData);
  }
};

termSchema.methods.updateTermParliamentGroup = async function (term, groupData) {
  const existingTerm = await Term.findOne({ term: term });

  if (existingTerm) {
    // Busca y actualiza el grupo parlamentario en el término existente
    const updated = await Term.findOneAndUpdate(
      { term: term, "parliamentGroups.code": groupData.groupId },
      { $set: { "parliamentGroups.$": groupData } },
      { new: true }
    );

    if (!updated) {
      // Si no se encuentra el grupo parlamentario, agrégalo
      existingTerm.parliamentGroups.push(groupData);
      await existingTerm.save();
    }
  } else {
    console.log(`Unable. Term ${term} not found.`);
  }
};



termSchema.methods.updateTermComposition = async function(termName, group, party, isNewRepresentative) {
  const updatedTerm = await Term.findOne({ term: termName });
  if (updatedTerm) {
    let updatedGroup = updatedTerm.parliamentGroups.find(pg => pg.name === group);
    if (!updatedGroup) {
      updatedGroup = {
        name: group,
        parties: [],
        representativeCount: 0,
      };
      updatedTerm.parliamentGroups.push(updatedGroup);
    }

    let updatedParty = updatedGroup.parties.find(p => p.name === party);
    if (!updatedParty) {
      updatedParty = {
        name: party,
        representativeCount: 0,
      };
      updatedGroup.parties.push(updatedParty);
    }
  
    if(isNewRepresentative) {
      updatedGroup.representativeCount++;
      updatedParty.representativeCount++;
    }

    await updatedTerm.save();
  }
};

termSchema.statics.getAllTerms = async function() {
  return await this.find({}).exec();
};

let Term;
try {
  Term = mongoose.model('Term');
} catch (error) {
  Term = mongoose.model('Term', termSchema);
}

module.exports = Term
