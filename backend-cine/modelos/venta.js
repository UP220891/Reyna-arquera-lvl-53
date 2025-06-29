const mongoose = require('mongoose');
const { Schema } = mongoose;

const ventaSchema = new Schema({
  total: { type: Number, required: true },
  membresia: { type: Boolean, required: true, default: false },
  usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: false },
  funcion: { type: Schema.Types.ObjectId, ref: 'Funcion', required: true },
  asientos: [
    {
      fila: { type: String, required: true },
      numero: { type: Number, required: true }
    }
  ]
}, {
  tableName: 'venta',
  timestamps: true
});

module.exports = mongoose.model('Venta', ventaSchema);