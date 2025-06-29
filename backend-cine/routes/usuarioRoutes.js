const express = require('express');
const router = express.Router();
const Usuario = require('../modelos/usuario');


// Obtener todos los usuarios (para el panel de empleado)
router.get('/', async (req, res) => {
  try {
    const usuarios = await Usuario.find({}, 'nombre email membresia rol _id');
    res.json(usuarios);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

module.exports = router;