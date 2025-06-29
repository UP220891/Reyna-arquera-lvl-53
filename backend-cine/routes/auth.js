const express = require('express');
const router = express.Router();
const Usuario = require('../modelos/usuario');

// Registro de usuario (sin encriptar)
router.post('/register', async (req, res) => {
  const { nombre, email, contraseña, rol, membresia } = req.body;
  if (!nombre || !email || !contraseña) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  try {
    const user = await Usuario.create({
      nombre,
      email,
      contraseña,
      rol: rol || 'cliente',
      membresia: membresia || false // <--- agrega esto
    });
    res.json({ ok: true, user: user.email });
  } catch (e) {
    res.status(400).json({ error: 'El usuario ya existe o hay un error' });
  }
});

// Login de usuario (sin encriptar)
router.post('/login', async (req, res) => {
  const { email, contraseña } = req.body;
  const user = await Usuario.findOne({ email, contraseña });
  if (!user) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' });
  }
  res.json({
    ok: true,
    user: user.email,
    id: user._id,
    rol: user.rol
  });
});

module.exports = router;