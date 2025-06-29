const express = require('express');
const router = express.Router();
const Sala = require('../modelos/sala');

// Obtener todas las salas
router.get('/', async (req, res) => {
  try {
    const salas = await Sala.find();
    res.status(200).json(salas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
);

router.post('/', async (req, res) => {
  const sala = new Sala(req.body);
  try {
    const nuevaSala = await sala.save();
    res.status(201).json({ ok: true, sala: nuevaSala }); // <--- respuesta estándar
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
module.exports = router;