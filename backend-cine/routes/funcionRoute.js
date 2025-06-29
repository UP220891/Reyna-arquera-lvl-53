const express = require('express');
const router = express.Router();
const Funcion = require('../modelos/funcion');
const Pelicula = require('../modelos/pelicula');
const Sala = require('../modelos/sala');

// GET /api/funciones

router.get('/', async (req, res) => {
  const { peliculaId, hora } = req.query;
  let filtro = {};
  if (peliculaId) filtro.pelicula = peliculaId;
  if (hora) filtro.hora = hora;
  try {
    const funciones = await Funcion.find(filtro)
      .populate('sala')
      .populate('pelicula');
    // Filtra funciones con datos incompletos
    const funcionesValidas = funciones.filter(f => f.pelicula && f.sala);
    res.json(funcionesValidas);
  } catch (e) {
    console.error('Error en GET /api/funciones:', e); // <--- Agrega esto para ver el error real
    res.status(500).json({ error: 'Error al obtener funciones', detalle: e.message });
  }
});

// POST /api/funciones
router.post('/', async (req, res) => {
  const { peliculaId, salaId, hora } = req.body;
  if (!peliculaId || !salaId || !hora) {
    return res.status(400).json({ error: 'Faltan datos para crear la función' });
  }
  try {
    // Verifica que existan la película y la sala
    const pelicula = await Pelicula.findById(peliculaId);
    const sala = await Sala.findById(salaId);
    if (!pelicula || !sala) {
      return res.status(404).json({ error: 'Película o sala no encontrada' });
    }
    const nuevaFuncion = new Funcion({
      pelicula: peliculaId,
      sala: salaId,
      hora
    });
    await nuevaFuncion.save();
    res.json({ ok: true, funcion: nuevaFuncion });
  } catch (e) {
    res.status(500).json({ error: 'Error al crear función', detalle: e.message });
  }
});

module.exports = router;