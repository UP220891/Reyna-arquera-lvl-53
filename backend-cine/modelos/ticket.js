const mongoose = require('mongoose');
const { Schema } = mongoose;

const ventaSchema = new Schema({
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    pelicula: { type: mongoose.Schema.Types.ObjectId, ref: 'Pelicula', required: true },
    asientos: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'Sala', required: true }
    ]
    ,
    costo: { type: Number, required: true },
    fecha: { type: Date, default: Date.now }
}, {
    timestamps: true
});

module.exports = mongoose.model('Venta', ventaSchema);
