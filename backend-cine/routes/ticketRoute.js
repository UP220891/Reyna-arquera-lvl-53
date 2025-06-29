const express = require('express');
const router = express.Router();
const Venta = require('../modelos/ticket'); // Tu modelo de Venta está en ticket.js

// Obtener asientos ocupados por película y sala
router.get('/ocupados', async (req, res) => {
  const { peliculaId, salaId } = req.query;
  try {
    // Busca ventas de esa película y sala
    const ventas = await Venta.find({
      pelicula: peliculaId,
      asientos: salaId // asientos es un array de ObjectId de Sala
    }).populate('asientos');

    // Extrae los asientos ocupados
    const asientosOcupados = [];
    ventas.forEach(v => {
      v.asientos.forEach(a => {
        // Si quieres fila y número, asegúrate que el modelo Sala tenga esos campos
        asientosOcupados.push({
          fila: a.fila,
          numero: a.numero
        });
      });
    });

    res.json(asientosOcupados);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener asientos ocupados' });
  }
});

module.exports = router;