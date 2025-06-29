const mongoose = require('mongoose');
const { Schema } = mongoose;

const ventaSchema = new Schema({
  total: { type: Number, required: true },
  membresia: { type: Boolean, required: true, default: false },
  usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  funcion: { type: Schema.Types.ObjectId, ref: 'Funcion', required: true }
  // Puedes agregar más campos si lo necesitas, como fecha, asientos, etc.
}, {
  tableName: 'venta',
  timestamps: true
});

module.exports = mongoose.model('Venta', ventaSchema);