const mongoose = require('mongoose');

const legislatureSchema = new mongoose.Schema({
  legislature: String,
  startDate: String,
  endDate: String,
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

let Legislature;
try {
  Legislature = mongoose.model('Legislature');
} catch (error) {
  Legislature = mongoose.model('Legislature', legislatureSchema);
}

module.exports = Legislature;