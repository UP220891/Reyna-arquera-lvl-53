const express = require('express');
const router = express.Router();
const Venta = require('../modelos/venta');
const Usuario = require('../modelos/usuario');
const Funcion = require('../modelos/funcion');
const Pelicula = require('../modelos/pelicula');

// Registrar una venta
router.post('/', async (req, res) => {
  console.log('POST /api/ventas body:', req.body);
  const { usuarioId, funcionId, asientos, membresia, empleadoId } = req.body;
  try {
    // Busca la función y la película asociada
    const funcion = await Funcion.findById(funcionId).populate('pelicula');
    console.log('Funcion encontrada:', funcion); // <-- LOG 1

    if (!funcion) return res.status(404).json({ error: 'Función no encontrada' });

    // Calcula el total en el backend
    const precioBoleto = 75;
    const numAsientos = Array.isArray(asientos) ? asientos.length : 0;
    let subtotal = numAsientos * precioBoleto;
    let esMembresia = false;
    let usuario = null;

    if (usuarioId) {
      usuario = await Usuario.findById(usuarioId);
      if (usuario && usuario.membresia) {
        subtotal = Math.round(subtotal * 0.9); // 10% de descuento
        esMembresia = true;
      }
    } else if (membresia) {
      subtotal = Math.round(subtotal * 0.9);
      esMembresia = true;
    }

    // LOG 2: Antes de crear la venta
    console.log('Datos para crear venta:', {
      usuario: usuarioId,
      empleado: empleadoId || usuarioId,
      funcion: funcionId,
      pelicula: funcion.pelicula ? funcion.pelicula._id : null,
      total: subtotal,
      asientos,
      membresia: esMembresia
    });

    const venta = await Venta.create({
      usuario: usuarioId,
      empleado: empleadoId || usuarioId,
      funcion: funcionId,
      pelicula: funcion.pelicula._id,
      total: subtotal,
      asientos,
      membresia: esMembresia
    });

    // LOG 3: Venta creada
    console.log('Venta creada:', venta);

    // --- Poblar usuario y funcion (con pelicula y sala) ---
    const ventaCompleta = await Venta.findById(venta._id)
      .populate('usuario')
      .populate({
        path: 'funcion',
        populate: [{ path: 'pelicula' }, { path: 'sala' }]
      });
    res.json({ ok: true, venta: ventaCompleta });
  } catch (e) {
    console.error('Error al guardar venta:', e); // <-- LOG 4
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
// Devuelve los boletos comprados por un usuario para una función específica
router.get('/mis-boletos', async (req, res) => {
  const { usuarioId, funcionId } = req.query;
  if (!usuarioId || !funcionId) {
    return res.status(400).json({ error: 'Faltan parámetros' });
  }
  try {
    const ventas = await Venta.find({ usuario: usuarioId, funcion: funcionId });
    // Junta todos los asientos comprados por ese usuario en esa función
    const asientos = ventas.flatMap(v => v.asientos);
    res.json(asientos);
  } catch (e) {
    res.status(500).json({ error: 'Error al consultar boletos del usuario' });
  }
});

module.exports = router;