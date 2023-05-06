const mongoose = require('mongoose');

const termSchema = new mongoose.Schema({
  term: String,
  startDate: String,
  endDate: String,
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
