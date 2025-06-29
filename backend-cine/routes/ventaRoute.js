const express = require('express');
const router = express.Router();
const Venta = require('../modelos/venta');
const Usuario = require('../modelos/usuario');
const Funcion = require('../modelos/funcion');
const Pelicula = require('../modelos/pelicula');

// Registrar una venta
router.post('/', async (req, res) => {
  console.log('POST /api/ventas body:', req.body);
  const { usuarioId, funcionId, total, asientos, membresia, empleadoId } = req.body;
  try {
    // Busca la función y la película asociada
    const funcion = await Funcion.findById(funcionId).populate('pelicula');
    if (!funcion) return res.status(404).json({ error: 'Función no encontrada' });

    // Busca el usuario para saber si tiene membresía
   let totalVenta = total;
let esMembresia = false;
let usuario = null;

if (usuarioId) {
  usuario = await Usuario.findById(usuarioId);
  if (usuario && usuario.membresia) {
    totalVenta = Math.round(total * 0.9); // 10% de descuento
    esMembresia = true;
  }
} else if (membresia) {
  // Venta de taquilla con membresía marcada manualmente
  totalVenta = Math.round(total * 0.9);
  esMembresia = true;
}
    const venta = await Venta.create({
      usuario: usuarioId,
      empleado: empleadoId || usuarioId,
      funcion: funcionId,
      pelicula: funcion.pelicula._id,
      total: totalVenta,
      asientos,
      membresia: esMembresia
    });

    // --- Poblar usuario y funcion (con pelicula y sala) ---
    const ventaCompleta = await Venta.findById(venta._id)
      .populate('usuario')
      .populate({
        path: 'funcion',
        populate: [{ path: 'pelicula' }, { path: 'sala' }]
      });
    res.json({ ok: true, venta: ventaCompleta });
  } catch (e) {
    res.status(400).json({ error: 'Error al guardar venta' });
  }
});

// a) Total de ventas realizadas
router.get('/total', async (req, res) => {
  try {
    const ventas = await Venta.find();
    const totalVentas = ventas.reduce((sum, v) => sum + (v.total || 0), 0);
    res.json({ totalVentas, cantidadVentas: ventas.length });
  } catch (e) {
    res.status(500).json({ error: 'Error al consultar total de ventas' });
  }
});

// b) Número de clientes atendidos
router.get('/clientes', async (req, res) => {
  try {
    const clientes = await Venta.distinct('usuario');
    res.json({ numClientes: clientes.length });
  } catch (e) {
    res.status(500).json({ error: 'Error al consultar número de clientes' });
  }
});

// c) Total de ventas a clientes con membresía
// d) Total de ventas a clientes sin membresía
router.get('/membresia/:valor', async (req, res) => {
  try {
    const membresia = req.params.valor === "true";
    const cantidad = await Venta.countDocuments({ membresia });
    res.json({ cantidad });
  } catch (e) {
    res.status(500).json({ error: 'Error al consultar ventas por membresía' });
  }
});

// e) Total de boletos vendidos por película
router.get('/boletos-por-pelicula', async (req, res) => {
  try {
    const results = await Venta.aggregate([
      {
        $group: {
          _id: "$pelicula",
          boletos: { $sum: { $size: "$asientos" } }
        }
      },
      {
        $lookup: {
          from: "peliculas",
          localField: "_id",
          foreignField: "_id",
          as: "pelicula"
        }
      },
      { $unwind: "$pelicula" },
      { $project: { titulo: "$pelicula.titulo", boletos: 1 } },
      { $sort: { boletos: -1 } }
    ]);
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: 'Error al consultar boletos por película' });
  }
});

// f) Total de boletos vendidos por sala
router.get('/boletos-por-sala', async (req, res) => {
  try {
    const results = await Venta.aggregate([
      {
        $lookup: {
          from: "funcions",
          localField: "funcion",
          foreignField: "_id",
          as: "funcion"
        }
      },
      { $unwind: "$funcion" },
      {
        $group: {
          _id: "$funcion.sala",
          boletos: { $sum: { $size: "$asientos" } }
        }
      },
      {
        $lookup: {
          from: "salas",
          localField: "_id",
          foreignField: "_id",
          as: "sala"
        }
      },
      { $unwind: "$sala" },
      { $project: { sala: "$sala.nombre", boletos: 1 } },
      { $sort: { boletos: -1 } }
    ]);
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: 'Error al consultar boletos por sala' });
  }
});

// g) Película más vendida
router.get('/pelicula-mas-vendida', async (req, res) => {
  try {
    const results = await Venta.aggregate([
      {
        $group: {
          _id: "$pelicula",
          boletos: { $sum: { $size: "$asientos" } }
        }
      },
      {
        $lookup: {
          from: "peliculas",
          localField: "_id",
          foreignField: "_id",
          as: "pelicula"
        }
      },
      { $unwind: "$pelicula" },
      { $project: { titulo: "$pelicula.titulo", boletos: 1 } },
      { $sort: { boletos: -1 } },
      { $limit: 1 }
    ]);
    if (results.length === 0) {
      res.json({ titulo: null, boletos: 0 });
    } else {
      res.json(results[0]);
    }
  } catch (e) {
    res.status(500).json({ error: 'Error al consultar película más vendida' });
  }
});

// h) Película menos vendida
router.get('/pelicula-menos-vendida', async (req, res) => {
  try {
    const results = await Venta.aggregate([
      {
        $group: {
          _id: "$pelicula",
          boletos: { $sum: { $size: "$asientos" } }
        }
      },
      {
        $lookup: {
          from: "peliculas",
          localField: "_id",
          foreignField: "_id",
          as: "pelicula"
        }
      },
      { $unwind: "$pelicula" },
      { $project: { titulo: "$pelicula.titulo", boletos: 1 } },
      { $sort: { boletos: 1 } },
      { $limit: 1 }
    ]);
    if (results.length === 0) {
      res.json({ titulo: null, boletos: 0 });
    } else {
      res.json(results[0]);
    }
  } catch (e) {
    res.status(500).json({ error: 'Error al consultar película menos vendida' });
  }
});
// Obtener todos los asientos vendidos para una función
router.get('/tickets', async (req, res) => {
  const { funcionId } = req.query;
  if (!funcionId) {
    return res.status(400).json({ error: 'Falta funcionId' });
  }
  try {
    // Busca todas las ventas de esa función y junta los asientos vendidos
    const ventas = await Venta.find({ funcion: funcionId });
    const asientos = [];
    ventas.forEach(v => {
      if (Array.isArray(v.asientos)) {
        asientos.push(...v.asientos);
      }
    });
    res.json(asientos);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener asientos vendidos', detalle: e.message });
  }
});

module.exports = router;