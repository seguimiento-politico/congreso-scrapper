const mongoose = require('mongoose');

const representativeLegislatureSchema = new mongoose.Schema({
    idLegislatura: Number,
    idDiputado: Number,
    circunscripcion: String,
    formacion: String,
    grupo: String,
    fecha_alta: Date,
    fecha_baja: Date,
});
  
const representativeSchema = new mongoose.Schema({
    apellidos: String,
    nombre: String,
    genero: String,
    fecha_nacimiento: Date,
    profesion: String, 
    legislatures: [representativeLegislatureSchema],
});

let representative;
try {
    representative = mongoose.model('representative');
} catch (error) {
    representative = mongoose.model('representative', representativeSchema);
}

module.exports = representative;
