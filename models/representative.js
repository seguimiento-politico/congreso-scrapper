const mongoose = require('mongoose');

const representativeLegislatureSchema = new mongoose.Schema({
    idLegislatura: Number,
    idDiputado: Number,
    circunscripcion: String,
    formacion: String,
    grupo: String,
    fecha_alta: String,
    fecha_baja: String,
});
  
const representativeSchema = new mongoose.Schema({
    apellidos: String,
    nombre: String,
    genero: String,
    fecha_nacimiento: String,
    profesion: String, 
    legislatures: [representativeLegislatureSchema],
});

representativeSchema.methods.saveRepresentative = async function(representativeData, legislatureData) {
    const Representative = this.constructor;
    const existingRepresentative = await Representative.findOne({
        apellidos: representativeData.apellidos,
        nombre: representativeData.nombre,
    });

    if (existingRepresentative) {
        const existingLegislature = existingRepresentative.legislatures.find(
            (leg) => leg.idLegislatura === legislatureData.idLegislatura
        );

        if (!existingLegislature) {
            existingRepresentative.legislatures.push(legislatureData);
            await existingRepresentative.save();
        }
    } else {
        const newRepresentative = new Representative(representativeData);
        newRepresentative.legislatures.push(legislatureData);
        await newRepresentative.save();
    }
};

let representative;
try {
    representative = mongoose.model('representative');
} catch (error) {
    representative = mongoose.model('representative', representativeSchema);
}

module.exports = representative;
