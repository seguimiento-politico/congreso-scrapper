const mongoose = require('mongoose');

const partiesSchema = new mongoose.Schema({
  name: String,
  representativeCount: { type: Number, default: 0 }
});

const parliamentGroupSchema = new mongoose.Schema({
  name: String,
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
    console.log(`Saved ${termData.term} term to MongoDB`);
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
