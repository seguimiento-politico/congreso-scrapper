const mongoose = require('mongoose');

const subcomissionSchema = new mongoose.Schema({
  name: String,
  code: String,
});

const comissionSchema = new mongoose.Schema({
  name: String,
  code: String,
  type: String,
  subcomissionSchema: [subcomissionSchema]
});

const partiesSchema = new mongoose.Schema({
  name: String,
  code: String,
  representativeCount: { type: Number, default: 0 }
});

const parliamentGroupSchema = new mongoose.Schema({
  name: String,
  code: String,
  seats: String,
  parties: [partiesSchema],
  representativeCount: { type: Number, default: 0 }
});

const termSchema = new mongoose.Schema({
  term: String,
  startDate: String,
  endDate: String,
  parliamentGroups: [parliamentGroupSchema],
  comissions: [comissionSchema]
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
    // Busca y actualiza el grupo parlamentario en la legislatura existente
    const updated = await Term.findOneAndUpdate(
      { term: term, "parliamentGroups.code": groupData.code },
      { $set: { "parliamentGroups.$": groupData } },
      { new: true }
    );
    
    if (!updated) {
      // Comprueba si el grupo parlamentario ya existe en la legislatura
      const groupExists = existingTerm.parliamentGroups.some(
        (group) => group.code === groupData.code
      );

      // Si no se encuentra el grupo parlamentario y no existe en la legislatura, agrégalo
      if (!groupExists) {
        existingTerm.parliamentGroups.push(groupData);
        await existingTerm.save();
      }
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

termSchema.methods.updateTermCommission = async function (term, commissionData) {
  const existingTerm = await Term.findOne({ term: term });

  if (existingTerm) {
    // Busca y actualiza la comisión en la legislatura existente
    const updated = await Term.findOneAndUpdate(
      { term: term, "comissions.code": commissionData.code },
      { $set: { "comissions.$": commissionData } },
      { new: true }
    );

    if (!updated) {
      // Comprueba si la comisión ya existe en la legislatura
      const commissionExists = existingTerm.comissions.some(
        (commission) => commission.code === commissionData.code
      );

      // Si no se encuentra la comisión y no existe en la legislatura, agrégala
      if (!commissionExists) {
        existingTerm.comissions.push(commissionData);
        await existingTerm.save();
      }
    }
  } else {
    console.log(`Unable. Term ${term} not found.`);
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
