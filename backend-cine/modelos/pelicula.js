const mongoose = require('mongoose');
const { Schema } = mongoose;

const peliculaSchema = new Schema({
    titulo: { type: String, required: true },
    categoria: { type: String, required: true },
});

module.exports = mongoose.model('Pelicula', peliculaSchema);