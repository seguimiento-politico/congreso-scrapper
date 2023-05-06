const mongoose = require('mongoose');

const partiesSchema = new mongoose.Schema({
  name: String,
  code: String,
});

const parliamentGroupSchema = new mongoose.Schema({
  term: String,
  name: String,
  code: String,
  seats: String,
  parties: [partiesSchema],
});

parliamentGroupSchema.methods.updateParliamentGroup = async function (term, groupData) {
  const existingGroup = await Group.findOne({ term: term, code: groupData.code });

  if (existingGroup) {
    Object.assign(existingGroup, groupData);
    await existingGroup.save();
  } else {
    const newGroup = new Group(groupData);
    await newGroup.save();
  }
};

parliamentGroupSchema.methods.updateComposition = async function (term, group, party, isNewRepresentative) {
  const updatedGroup = await Group.findOne({ term: term, name: group });

  if (updatedGroup) {
    let updatedParty = updatedGroup.parties.find(p => p.name === party);
    if (!updatedParty) {
      updatedParty = {
        name: party,
        representativeCount: 0,
      };
      updatedGroup.parties.push(updatedParty);
    }

    if (isNewRepresentative) {
      updatedGroup.representativeCount++;
      updatedParty.representativeCount++;
    }

    await updatedGroup.save();
  }
};

let Group;
try {
  Group = mongoose.model('Group');
} catch (error) {
  Group = mongoose.model('Group', parliamentGroupSchema);
}

module.exports = Group;
