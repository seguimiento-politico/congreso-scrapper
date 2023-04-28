const mongoose = require('mongoose');

const representativeTermSchema = new mongoose.Schema({
    term: Number,
    representativeId: Number,
    circunscripcion: String,
    party: String,
    parliamentGroup: String,
    startDate: String,
    endDate: String,
});
  
const representativeSchema = new mongoose.Schema({
    surnames: String,
    name: String,
    gender: String,
    birthday: String,
    profesion: String, 
    terms: [representativeTermSchema],
});

representativeSchema.methods.saveRepresentative = async function(representativeData, termData) {
    let isNew = false;
    const Representative = this.constructor;
    
    const existingRepresentative = await Representative.findOne({
        surnames: representativeData.surnames,
        name: representativeData.name,
    });

    if (existingRepresentative) {
        const existingTerm = existingRepresentative.terms.find(
            (leg) => leg.term === termData.term
        );

        if (!existingTerm) {
            existingRepresentative.terms.push(termData);
            await existingRepresentative.save();
            isNew = true;
        }
    } else {
        const newRepresentative = new Representative(representativeData);
        newRepresentative.terms.push(termData);
        await newRepresentative.save();
        isNew = true;
    }
    return isNew;
};

let representative;
try {
    representative = mongoose.model('representative');
} catch (error) {
    representative = mongoose.model('representative', representativeSchema);
}

module.exports = representative;
