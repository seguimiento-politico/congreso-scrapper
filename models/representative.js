const mongoose = require('mongoose');

const representativeLegislatureSchema = new mongoose.Schema({
    legislature: Number,
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
    legislatures: [representativeLegislatureSchema],
});

representativeSchema.methods.saveRepresentative = async function(representativeData, legislatureData) {
    let isNew = false;
    const Representative = this.constructor;
    const existingRepresentative = await Representative.findOne({
        surnames: representativeData.surnames,
        name: representativeData.name,
    });

    if (existingRepresentative) {
        const existingLegislature = existingRepresentative.legislatures.find(
            (leg) => leg.legislature === legislatureData.legislature
        );

        if (!existingLegislature) {
            existingRepresentative.legislatures.push(legislatureData);
            await existingRepresentative.save();
            isNew = true;
        }
    } else {
        const newRepresentative = new Representative(representativeData);
        newRepresentative.legislatures.push(legislatureData);
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
