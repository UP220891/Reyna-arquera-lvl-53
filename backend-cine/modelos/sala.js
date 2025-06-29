const mongoose = require('mongoose');
const { Schema } = mongoose;

const salaSchema = new Schema({
   nombre : { type: String, required: true },
});
module.exports = mongoose.model('Sala', salaSchema);
