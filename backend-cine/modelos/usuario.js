const mongoose = require('mongoose');
const { Schema } = mongoose;

const usuarioSchema = new Schema({
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    contraseña: { type: String, required: true },
    rol: { type: String, enum: ['empleado', 'cliente'], default: 'cliente' },
    membresia: { type: Boolean, default: false }
});

module.exports = mongoose.model('Usuario', usuarioSchema);