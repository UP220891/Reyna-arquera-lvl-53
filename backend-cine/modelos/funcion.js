const mongoose = require('mongoose');
const { Schema } = mongoose;

const funcionSchema = new Schema({
  pelicula: { type: Schema.Types.ObjectId, ref: 'Pelicula', required: true },
  sala: { type: Schema.Types.ObjectId, ref: 'Sala', required: true },
  hora: { type: String, required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Funcion', funcionSchema);