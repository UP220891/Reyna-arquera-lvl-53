
const express = require('express');
const connectDB = require('./config/database');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

connectDB(); // Conectar a la base de datos
// Importar rutas
const authRoutes = require('./routes/auth');
const salaRoutes = require('./routes/salaRoute');
const ventaRoute = require('./routes/ventaRoute');
const peliculaRoute = require('./routes/peliculaRoute');
const funcionRoute = require('./routes/funcionRoute');

app.use('/api/peliculas', peliculaRoute);
app.use('/api/funciones', funcionRoute);
app.use('/api/ventas', ventaRoute);
app.use('/api/auth', authRoutes);
app.use('/api/salas', salaRoutes);


app.get('/', (req, res) => {
  res.send('¡Servidor funcionando correctamente!');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
