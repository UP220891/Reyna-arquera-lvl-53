const express = require('express');
const router = express.Router();
const Pelicula = require('../modelos/pelicula');

// Obtener todas las películas
router.get('/', async (req, res) => {
  try {
    const peliculas = await Pelicula.find();
    res.json(peliculas);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener películas' });
  }
});

router.post('/', async (req, res) => {
  try {
    const nuevaPelicula = new Pelicula(req.body);
    await nuevaPelicula.save();
    res.status(201).json({ ok: true, pelicula: nuevaPelicula }); // <--- Cambia esto
  } catch (err) {
    res.status(400).json({ error: 'Error al crear película' });
  }
});

module.exports = router;