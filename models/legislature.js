const mongoose = require('mongoose');

const partiesSchema = new mongoose.Schema({
  name: String,
});

const parliamentGroupSchema = new mongoose.Schema({
  name: String,
  parties: [partiesSchema],
});

const legislatureSchema = new mongoose.Schema({
  legislature: String,
  startDate: String,
  endDate: String,
  parliamentGroups: [parliamentGroupSchema]
});

legislatureSchema.methods.updateLegislature = async function(legislatureData) {
  const existingLegislature = await Legislature.findOne({ legislature: legislatureData.legislature });
  if (existingLegislature) {
    if (existingLegislature.startDate !== legislatureData.startDate || existingLegislature.endDate !== legislatureData.endDate) {
      Object.assign(existingLegislature, legislatureData);
      await existingLegislature.save();
      console.log(`Updated ${existingLegislature.legislature} legislature`);
    }
  } else {
    await Legislature.create(legislatureData);
    console.log(`Saved ${legislatureData.legislature} legislature to MongoDB`);
  }
};

legislatureSchema.methods.updateLegislatureComposition = async function(legislatureName, group, party) {
  const updatedLegislature = await Legislature.findOne({ legislature: legislatureName });
  if (updatedLegislature) {
    let updatedGroup = updatedLegislature.parliamentGroups.find(pg => pg.name === group);
    if (!updatedGroup) {
      updatedGroup = {
        name: group,
        parties: []
      };
      updatedLegislature.parliamentGroups.push(updatedGroup);
    }

    let updatedParty = updatedGroup.parties.find(p => p.name === party);
    if (!updatedParty) {
      updatedParty = {
        name: party,
      };
      updatedGroup.parties.push(updatedParty);
    }

    await updatedLegislature.save();
  }
};


let Legislature;
try {
  Legislature = mongoose.model('Legislature');
} catch (error) {
  Legislature = mongoose.model('Legislature', legislatureSchema);
}

module.exports = Legislature
