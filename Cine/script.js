const API_URL = "http://localhost:3000/api";

let nombreUsuario = "";
let usuarioMembresia = false;
let funcionesDisponibles = []; 
let usuarioId = null;
let nombreRealUsuario = "";

// ========== ALERTAS BONITAS ==========
function mostrarAlerta(selector, mensaje, tipo = "exito", tiempo = 2000) {
  const clases = {
    exito: "mensaje-exito",
    error: "mensaje-error",
    warning: "mensaje-warning"
  };
  const id = "alerta-" + Math.random().toString(36).substr(2, 9);
  const div = `
    <div id="${id}" class="${clases[tipo] || clases.exito}" style="position:relative;">
      <span style="position:absolute;top:4px;right:10px;cursor:pointer;font-weight:bold;font-size:18px;" onclick="this.parentElement.style.display='none'">&times;</span>
      ${mensaje}
    </div>
  `;
  document.querySelector(selector).innerHTML = div;
  if (tiempo > 0) {
    setTimeout(() => {
      const alerta = document.getElementById(id);
      if (alerta) alerta.style.display = "none";
    }, tiempo);
  }
}

// ========== INICIO Y CIERRE DE SESIÓN ==========
async function iniciarSesion() {
  const email = document.getElementById("usuario").value;
  const contraseña = document.getElementById("contrasena").value;

  if (email && contraseña) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, contraseña })
    });
    const data = await res.json();
    if (res.ok) {
      nombreUsuario = email;
      usuarioMembresia = !!data.membresia;
      usuarioId = data.usuarioId;
      nombreRealUsuario = data.nombre;
      document.getElementById("login").style.display = "none";
      document.getElementById("logout").style.display = "block";
      if (data.rol === "empleado") {
        document.getElementById("panel-empleado").style.display = "block";
        document.getElementById("salas").style.display = "none";
      } else {
        document.getElementById("panel-empleado").style.display = "none";
        document.getElementById("salas").style.display = "block";
        cargarFuncionesUsuario();
      }
    } else {
      mostrarAlerta("#msgLogin", data.error || "Error al iniciar sesión.", "error");
    }
  } else {
    mostrarAlerta("#msgLogin", "Ingrese usuario y contraseña", "warning");
  }
}

function cerrarSesion() {
  nombreUsuario = "";
  document.getElementById("login").style.display = "block";
  document.getElementById("salas").style.display = "none";
  document.getElementById("panel-empleado").style.display = "none";
  document.getElementById("registro").style.display = "none";
  document.getElementById("logout").style.display = "none";
  document.getElementById("ticket").style.display = "none";
  document.getElementById("usuario").value = "";
  document.getElementById("contrasena").value = "";
  document.getElementById("boletosCompradosUsuario").innerHTML = "";
  document.getElementById("btnDescargarPDF").style.display = "none";
  document.getElementById("asientosContainer").innerHTML = "";
  window.funcionSeleccionadaId = null; // <-- Limpia la función seleccionada
}

// ========== USUARIO: SELECCIÓN DE FUNCIÓN Y ASIENTOS ==========
function cargarFuncionesUsuario() {
   window.funcionSeleccionadaId = null;
  document.getElementById("asientosContainer").innerHTML = ""; // <-- Limpia asientos
  document.getElementById("boletosCompradosUsuario").innerHTML = ""; // <-- Limpia boletos comprados // <-- Limpia la función seleccionada
  fetch(`${API_URL}/funciones`)
    .then(res => res.json())
    .then(funciones => {
      funcionesDisponibles = funciones;
      const container = document.getElementById("funcionesContainer");
      container.innerHTML = "";
      if (!Array.isArray(funciones) || funciones.length === 0) {
        container.innerHTML = "<p>No hay funciones disponibles.</p>";
        return;
      }
      funciones.forEach(f => {
        if (f.pelicula && f.sala) {
          const card = document.createElement("div");
          card.className = "funcion-card";
          card.innerHTML = `
            <div class="funcion-titulo">${f.pelicula.titulo}</div>
            <div class="funcion-info">Sala: <b>${f.sala.nombre}</b></div>
            <div class="funcion-info">Hora: <b>${f.hora}</b></div>
          `;
          card.onclick = () => {
            seleccionarFuncion(f._id);
          };
          container.appendChild(card);
        }
      });
    });
}

function seleccionarFuncion(funcionId) {
  // Marca la tarjeta seleccionada
  document.querySelectorAll('.funcion-card').forEach(card => card.classList.remove('seleccionada'));
  const selectedCard = Array.from(document.querySelectorAll('.funcion-card')).find(card =>
    card.innerHTML.includes(funcionesDisponibles.find(f => f._id === funcionId).pelicula.titulo)
  );
  if (selectedCard) selectedCard.classList.add('seleccionada');
  // Guarda el id seleccionado en una variable global
  window.funcionSeleccionadaId = funcionId;
  generarAsientosUsuario(funcionId);
  mostrarBoletosComprados(funcionId);
}

function generarAsientosUsuario(funcionId) {
  funcionId = funcionId || window.funcionSeleccionadaId;
  const cont = document.getElementById("asientosContainer");
  cont.innerHTML = "";
  if (!funcionId) return;

  // Agrega la barra de pantalla igual que en empleados
  const pantallaDiv = document.createElement("div");
  pantallaDiv.className = "pantalla-guia";
  pantallaDiv.textContent = "Pantalla";
  cont.appendChild(pantallaDiv);

  const filas = [];
  for (let i = 0; i < 10; i++) filas.push(String.fromCharCode(65 + i));
  const asientosPorFila = 7;

  fetch(`${API_URL}/ventas/tickets?funcionId=${funcionId}`)
    .then(res => res.json())
    .then(asientosOcupados => {
      const ocupadosSet = new Set(asientosOcupados.map(a => `${a.fila}-${a.numero}`));
      for (let fila of filas) {
        const filaDiv = document.createElement("div");
        filaDiv.className = "fila-asientos";
        for (let i = 1; i <= asientosPorFila; i++) {
          const div = document.createElement("div");
          div.className = "asiento disponible";
          div.dataset.fila = fila;
          div.dataset.numero = i;
          div.innerHTML = `${fila}-${i}`;
          div.style.fontSize = "0.85em";
          div.style.lineHeight = "38px";
          const key = `${fila}-${i}`;
          if (ocupadosSet.has(key)) {
            div.classList.remove("disponible");
            div.classList.add("ocupado");
          }
          div.onclick = () => {
            if (!div.classList.contains("ocupado")) {
              div.classList.toggle("reservado");
            }
          };
          filaDiv.appendChild(div);
        }
        cont.appendChild(filaDiv);
      }
    });
}

function comprar() {
  const funcionId = window.funcionSeleccionadaId; // <-- usa la variable global
  const reservados = document.querySelectorAll("#asientosContainer .asiento.reservado");
  if (!funcionId || reservados.length === 0) {
    mostrarAlerta("#msgCompra", "Selecciona una función y al menos un asiento.", "warning");
    return;
  }
  const asientos = [];
  reservados.forEach(a => {
    asientos.push({ fila: a.dataset.fila, numero: a.dataset.numero });
  });

  const funcion = funcionesDisponibles.find(f => f._id === funcionId);
  if (!funcion) {
    mostrarAlerta("#msgCompra", "No se encontró la función seleccionada.", "error");
    return;
  }

  let total = asientos.length * 75;
  let totalOriginal = total;
  let tieneMembresia = usuarioMembresia === true;
  if (tieneMembresia) {
    total = Math.round(total * 0.9);
  }
  fetch(`${API_URL}/ventas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      usuarioId,
      funcionId,
      total,
      asientos,
      membresia: tieneMembresia
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.ok) {
        document.getElementById("ticket").style.display = "block";
        document.getElementById("btnDescargarPDF").style.display = "inline-block";
        let detalles = `<strong>Usuario:</strong> ${nombreRealUsuario}<br>`;
        detalles += `<strong>Película:</strong> ${funcion.pelicula.titulo}<br>`;
        detalles += `<strong>Sala:</strong> ${funcion.sala.nombre}<br>`;
        detalles += `<strong>Hora:</strong> ${funcion.hora}<br>`;
        detalles += `<strong>Asientos:</strong> ${asientos.map(a => `${a.fila}-${a.numero}`).join(", ")}<br>`;
        if (tieneMembresia) {
          detalles += `<strong>Subtotal:</strong> $${totalOriginal}<br>`;
          detalles += `<strong>Descuento membresía (10%):</strong> -$${totalOriginal - total}<br>`;
        }
        document.getElementById("detallesBoleto").innerHTML = detalles;
        document.getElementById("totalPago").textContent = "Total: $" + total;
        generarAsientosUsuario();
        mostrarBoletosComprados();
        mostrarAlerta("#msgCompra", "¡Compra realizada con éxito!", "exito");
      } else {
        mostrarAlerta("#msgCompra", data.error || "Error al comprar.", "error");
      }
    })
    .catch(() => mostrarAlerta("#msgCompra", "Error de conexión", "error"));
}

// ========== PANEL EMPLEADO Y OTRAS FUNCIONES ==========

function cargarPeliculas() {
  fetch(`${API_URL}/peliculas`)
    .then(res => res.json())
    .then(peliculas => {
      const container = document.getElementById("peliculasContainer");
      container.innerHTML = "";
      const select = document.createElement("select");
      select.id = "peliculaSeleccion";
      peliculas.forEach(p => {
        const option = document.createElement("option");
        option.value = p._id;
        option.textContent = p.titulo + " - " + (p.categoria || "");
        select.appendChild(option);
      });
      container.appendChild(select);
    })
    .catch(err => {
      console.error("Error al cargar películas:", err);
      const container = document.getElementById("peliculasContainer");
      container.innerHTML = "<p>Error al cargar películas</p>";
    });
}

function generarAsientos() {
  const cont = document.getElementById("asientosContainer");
  cont.innerHTML = "";
  const filas = ["A", "B", "C", "D"];
  let contador = 0;
  for (let fila of filas) {
    for (let i = 1; i <= 5; i++) {
      const div = document.createElement("div");
      div.className = "asiento disponible";
      div.dataset.fila = fila;
      div.dataset.numero = i;
      div.onclick = () => {
        if (!div.classList.contains("ocupado")) {
          div.classList.toggle("reservado");
        }
      };
      cont.appendChild(div);
      contador++;
      if (contador >= 20) break;
    }
    if (contador >= 20) break;
    cont.appendChild(document.createElement("br"));
  }
}

function registrarUsuario() {
  const nombre = document.getElementById("nombreRegistro").value.trim();
  const email = document.getElementById("emailRegistro").value.trim();
  const contraseña = document.getElementById("contrasenaRegistro").value;
  if (!nombre || !email || !contraseña) {
    mostrarAlerta("#msgRegistro", "Por favor, llena todos los campos.", "warning");
    return;
  }
  if (contraseña.length < 8) {
    mostrarAlerta("#msgRegistro", "La contraseña debe tener al menos 8 caracteres.", "warning");
    return;
  }
  fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, email, contraseña })
  })
    .then(res => res.json())
    .then(data => {
      if (data.ok) {
        mostrarAlerta("#msgRegistro", "¡Registro exitoso! Ahora puedes iniciar sesión.", "exito");
        setTimeout(() => cancelarRegistro(), 1500);
      } else {
        mostrarAlerta("#msgRegistro", data.error || "Error al registrar", "error");
      }
    })
    .catch(() => mostrarAlerta("#msgRegistro", "Error de conexión con el servidor", "error"));
}

function registrar() {
  document.getElementById("login").style.display = "none";
  document.getElementById("registro").style.display = "block";
}

function cancelarRegistro() {
  document.getElementById("registro").style.display = "none";
  document.getElementById("login").style.display = "block";
}

// ========== PANEL EMPLEADO ==========

function mostrarCrearUsuario() {
  document.getElementById("contenido-empleado").innerHTML = `
    <h3>Crear Usuario</h3>
    <form id="formCrearUsuario" style="display:flex; flex-direction:column; gap:10px; max-width:300px;">
      <label>Nombre de usuario:
        <input type="text" id="nuevoUsuario" required>
      </label>
      <label>Email:
        <input type="email" id="nuevoEmail" required>
      </label>
      <label>Contraseña:
        <input type="password" id="nuevoContrasena" required>
      </label>
      <label>Rol:
        <select id="nuevoRol" required>
          <option value="cliente">Cliente</option>
          <option value="empleado">Empleado</option>
        </select>
      </label>
      <label id="labelMembresia">¿Tiene membresía?
        <select id="nuevoMembresia" required>
          <option value="0">No</option>
          <option value="1">Sí</option>
        </select>
      </label>
      <button type="submit">Crear Usuario</button>
    </form>
    <div id="msgCrearUsuario" style="margin-top:10px;"></div>
  `;

  // Mostrar/ocultar membresía según el rol
  document.getElementById("nuevoRol").addEventListener("change", function() {
    const esCliente = this.value === "cliente";
    document.getElementById("labelMembresia").style.display = esCliente ? "block" : "none";
    document.getElementById("nuevoMembresia").disabled = !esCliente;
  });
  // Inicializa el estado al cargar
  document.getElementById("nuevoRol").dispatchEvent(new Event("change"));

  document.getElementById("formCrearUsuario").onsubmit = function(e) {
    e.preventDefault();
    const nombre = document.getElementById("nuevoUsuario").value.trim();
    const email = document.getElementById("nuevoEmail").value.trim();
    const contraseña = document.getElementById("nuevoContrasena").value;
    const rol = document.getElementById("nuevoRol").value;
    // Solo toma membresía si es cliente
    const membresia = rol === "cliente" && document.getElementById("nuevoMembresia").value === "1";

    // Validar si ya existe un usuario con ese email
    fetch(`${API_URL}/usuarios`)
      .then(res => res.json())
      .then(usuarios => {
        const existe = usuarios.some(u => u.email.toLowerCase() === email.toLowerCase());
        if (existe) {
          mostrarAlerta("#msgCrearUsuario", "Ya existe un usuario con ese email.", "error");
          return;
        }
        // Si no existe, lo crea
        fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, email, contraseña, rol, membresia })
        })
          .then(res => res.json())
          .then(data => {
            if (data.ok) {
              mostrarAlerta("#msgCrearUsuario", "Usuario creado correctamente", "exito");
              setTimeout(() => mostrarCrearUsuario(), 1500);
            } else {
              mostrarAlerta("#msgCrearUsuario", data.error || "Error al crear usuario", "error");
            }
          })
          .catch(() => mostrarAlerta("#msgCrearUsuario", "Error de conexión", "error"));
      });
  };
}

function mostrarAgregarFuncion() {
  Promise.all([
    fetch(`${API_URL}/peliculas`).then(res => res.json()),
    fetch(`${API_URL}/salas`).then(res => res.json())
  ]).then(([peliculas, salas]) => {
    let html = `
      <h3>Agregar Función</h3>
      <form id="formAgregarFuncion">
        <label>Película:</label>
        <select id="funcionPelicula" required>
          <option disabled selected>Seleccione la película</option>
          ${peliculas.map(p => `<option value="${p._id}">${p.titulo}</option>`).join('')}
        </select>
        <label>Sala:</label>
        <select id="funcionSala" required>
          <option disabled selected>Seleccione la sala</option>
          ${salas.map(s => `<option value="${s._id}">${s.nombre}</option>`).join('')}
        </select>
        <label>Hora:</label>
        <input type="text" id="funcionHora" required placeholder="Ej: 18:00">
        <button type="submit">Agregar Función</button>
      </form>
      <div id="msgFuncion"></div>
    `;
    document.getElementById("contenido-empleado").innerHTML = html;
document.getElementById("formAgregarFuncion").onsubmit = function(e) {
  e.preventDefault();
  const peliculaId = document.getElementById("funcionPelicula").value;
  const salaId = document.getElementById("funcionSala").value;
  const hora = document.getElementById("funcionHora").value;

  // Validación: buscar si ya existe función en esa sala y hora o misma película/sala/hora
  fetch(`${API_URL}/funciones`)
    .then(res => res.json())
    .then(funciones => {
      const conflicto = funciones.some(f =>
        (f.sala._id === salaId && f.hora === hora) ||
        (f.pelicula._id === peliculaId && f.sala._id === salaId && f.hora === hora)
      );
      if (conflicto) {
        mostrarAlerta("#msgFuncion", "Ya existe una función con esa película, sala y hora.", "error");
        return;
      }

      // Si no hay conflicto, ahora sí agrega la función
      fetch(`${API_URL}/funciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peliculaId, salaId, hora })
      })
        .then(res => res.json())
        .then(data => {
          if (data.ok) {
            mostrarAlerta("#msgFuncion", "Función agregada correctamente", "exito");
            setTimeout(() => mostrarAgregarFuncion(), 1500);
          } else {
            mostrarAlerta("#msgFuncion", data.error || "Error al agregar función", "error");
          }
        })
        .catch(() => mostrarAlerta("#msgFuncion", "Error de conexión", "error"));
    });
};
  });
}
function mostrarAgregarPelicula() {
  document.getElementById("contenido-empleado").innerHTML = `
    <h3>Agregar Película</h3>
    <form id="formAgregarPelicula">
      <label>Título:</label>
      <input type="text" id="tituloPelicula" required>
      <label>Categoría:</label>
      <input type="text" id="categoriaPelicula" required>
      <button type="submit">Agregar Película</button>
    </form>
    <div id="msgPelicula"></div>
  `;

  document.getElementById("formAgregarPelicula").onsubmit = function(e) {
    e.preventDefault();
    const titulo = document.getElementById("tituloPelicula").value.trim();
    const categoria = document.getElementById("categoriaPelicula").value.trim();

    // Validar si ya existe una película con ese título (case-insensitive)
    fetch(`${API_URL}/peliculas`)
      .then(res => res.json())
      .then(peliculas => {
        const existe = peliculas.some(p => p.titulo.toLowerCase() === titulo.toLowerCase());
        if (existe) {
          mostrarAlerta("#msgPelicula", "Ya existe una película con ese título.", "error");
          return;
        }
        // Si no existe, la agrega
        fetch(`${API_URL}/peliculas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ titulo, categoria })
        })
          .then(res => res.json())
          .then(data => {
            if (data.ok) {
              mostrarAlerta("#msgPelicula", "Película agregada correctamente", "exito");
              setTimeout(() => mostrarAgregarPelicula(), 1500);
            } else {
              mostrarAlerta("#msgPelicula", data.error || "Error al agregar película", "error");
            }
          })
          .catch(() => mostrarAlerta("#msgPelicula", "Error de conexión", "error"));
      });
  };
}

function mostrarConsultas() {
  document.getElementById("contenido-empleado").innerHTML = `
    <div class="consultas-panel">
      <h2>Consultas y Reportes</h2>
      <ul class="consultas-list">
        <li><button class="consulta-btn" onclick="consultaTotalVentas()">Total de ventas realizadas</button></li>
        <li><button class="consulta-btn" onclick="consultaNumClientes()">Número de clientes atendidos</button></li>
        <li><button class="consulta-btn" onclick="consultaVentasMembresia(true)">Total ventas a clientes con membresía</button></li>
        <li><button class="consulta-btn" onclick="consultaVentasMembresia(false)">Total ventas a clientes sin membresía</button></li>
        <li><button class="consulta-btn" onclick="consultaBoletosPorPelicula()">Total de boletos vendidos por película</button></li>
        <li><button class="consulta-btn" onclick="consultaBoletosPorSala()">Total de boletos vendidos por sala</button></li>
        <li><button class="consulta-btn" onclick="consultaPeliculaMasVendida()">Película más vendida</button></li>
        <li><button class="consulta-btn" onclick="consultaPeliculaMenosVendida()">Película menos vendida</button></li>
      </ul>
      <div id="resultadoConsulta"></div>
    </div>
  `;
}

function consultaTotalVentas() {
  fetch(`${API_URL}/ventas/total`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("contenido-empleado").innerHTML = `
        <h3>Total de ventas realizadas</h3>
        <strong>Total de ventas realizadas:</strong> $${data.totalVentas} <br>
        <strong>Cantidad de ventas:</strong> ${data.cantidadVentas}
        <br><button onclick="mostrarConsultas()" class="btn-action">Volver</button>
      `;
    });
}

function mostrarAgregarSala() {
  document.getElementById("contenido-empleado").innerHTML = `
    <h3>Agregar Sala</h3>
    <form id="formAgregarSala">
      <label>Nombre de la sala:</label>
      <input type="text" id="nombreSala" required>
      <button type="submit">Agregar Sala</button>
    </form>
    <div id="msgSala"></div>
  `;
  document.getElementById("formAgregarSala").onsubmit = function(e) {
    e.preventDefault();
    const nombre = document.getElementById("nombreSala").value.trim();

    // Validar si ya existe una sala con ese nombre (case-insensitive)
    fetch(`${API_URL}/salas`)
      .then(res => res.json())
      .then(salas => {
        const existe = salas.some(s => s.nombre.toLowerCase() === nombre.toLowerCase());
        if (existe) {
          mostrarAlerta("#msgSala", "Ya existe una sala con ese nombre.", "error");
          return;
        }
        // Si no existe, la agrega
        fetch(`${API_URL}/salas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre })
        })
          .then(res => res.json())
          .then(data => {
            if (data.ok) {
              mostrarAlerta("#msgSala", "Sala agregada correctamente", "exito");
              setTimeout(() => mostrarAgregarSala(), 1500);
            } else {
              mostrarAlerta("#msgSala", data.error || "Error al agregar sala", "error");
            }
          })
          .catch(() => mostrarAlerta("#msgSala", "Error de conexión", "error"));
      });
  };
}
function mostrarAgregarSala() {
  document.getElementById("contenido-empleado").innerHTML = `
    <h3>Agregar Sala</h3>
    <form id="formAgregarSala">
      <label>Nombre de la sala:</label>
      <input type="text" id="nombreSala" required>
      <button type="submit">Agregar Sala</button>
    </form>
    <div id="msgSala"></div>
  `;
  document.getElementById("formAgregarSala").onsubmit = function(e) {
    e.preventDefault();
    const nombre = document.getElementById("nombreSala").value.trim();

    // Validar si ya existe una sala con ese nombre (case-insensitive)
    fetch(`${API_URL}/salas`)
      .then(res => res.json())
      .then(salas => {
        const existe = salas.some(s => s.nombre.toLowerCase() === nombre.toLowerCase());
        if (existe) {
          mostrarAlerta("#msgSala", "Ya existe una sala con ese nombre.", "error");
          return;
        }
        // Si no existe, la agrega
        fetch(`${API_URL}/salas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre })
        })
          .then(res => res.json())
          .then(data => {
            if (data.ok) {
              mostrarAlerta("#msgSala", "Sala agregada correctamente", "exito");
              setTimeout(() => mostrarAgregarSala(), 1500);
            } else {
              mostrarAlerta("#msgSala", data.error || "Error al agregar sala", "error");
            }
          })
          .catch(() => mostrarAlerta("#msgSala", "Error de conexión", "error"));
      });
  };
}

function mostrarVentaEmpleado() {
  Promise.all([
    fetch(`${API_URL}/funciones`).then(res => res.json()),
    fetch(`${API_URL}/usuarios`).then(res => res.json())
  ]).then(([funciones, usuarios]) => {
    if (!funciones.length) {
      document.getElementById("contenido-empleado").innerHTML = "<h3>No hay funciones disponibles</h3>";
      return;
    }
    let html = `
      <h3>Venta de Boletos (Taquilla)</h3>
      <form id="formVentaEmpleado">
        <label>Selecciona usuario:</label>
        <select id="usuarioVenta" required>
          <option disabled selected>Selecciona usuario</option>
          ${usuarios.filter(u => u.rol === "cliente").map(u =>
            `<option value="${u._id}" data-membresia="${u.membresia}">${u.nombre} (${u.email})</option>`
          ).join('')}
        </select>
        <label>¿Tiene membresía?</label>
        <select id="membresiaCliente" required disabled>
          <option value="0">No</option>
          <option value="1">Sí</option>
        </select>
        <label>Función:</label>
        <select id="funcionVenta" required>
          <option disabled selected>Seleccione función</option>
          ${funciones.map(f =>
            `<option value="${f._id}">${f.pelicula.titulo} - Sala ${f.sala.nombre} - ${f.hora}</option>`
          ).join('')}
        </select>
      </form>
      <div id="asientosEmpleadoContainer"></div>
      <button id="btnVenderEmpleado" class="btn-action" style="display:none;">Vender</button>
      <div id="msgVentaEmpleado"></div>
    `;

    document.getElementById("contenido-empleado").innerHTML = html;

    document.getElementById("usuarioVenta").addEventListener("change", function () {
      const selected = this.options[this.selectedIndex];
      usuarioSeleccionado = usuarios.find(u => u._id === selected.value);
      document.getElementById("membresiaCliente").value = selected.getAttribute("data-membresia") === "true" ? "1" : "0";
    });

    document.getElementById("funcionVenta").addEventListener("change", function () {
      const funcionId = this.value;
      funcionSeleccionada = funciones.find(f => f._id == funcionId);
      generarAsientosEmpleado(funcionSeleccionada);
    });

    function generarAsientosEmpleado(funcion) {
      const cont = document.getElementById("asientosEmpleadoContainer");
      cont.innerHTML = "";
      if (!funcion) return;

      const pantallaDiv = document.createElement("div");
      pantallaDiv.className = "pantalla-guia";
      pantallaDiv.textContent = "Pantalla";
      cont.appendChild(pantallaDiv);

      const filas = [];
      for (let i = 0; i < 10; i++) {
        filas.push(String.fromCharCode(65 + i));
      }
      const asientosPorFila = 7;

      fetch(`${API_URL}/ventas/tickets?funcionId=${funcion._id}`)
        .then(res => res.json())
        .then(asientosOcupados => {
          const ocupadosSet = new Set(asientosOcupados.map(a => `${a.fila}-${a.numero}`));
          for (let fila of filas) {
            const filaDiv = document.createElement("div");
            filaDiv.className = "fila-asientos";
            for (let i = 1; i <= asientosPorFila; i++) {
              const div = document.createElement("div");
              div.className = "asiento disponible";
              div.dataset.fila = fila;
              div.dataset.numero = i;
              div.innerHTML = `${fila}-${i}`;
              div.style.fontSize = "0.85em";
              div.style.lineHeight = "38px";
              const key = `${fila}-${i}`;
              if (ocupadosSet.has(key)) {
                div.classList.remove("disponible");
                div.classList.add("ocupado");
              }
              div.onclick = () => {
                if (!div.classList.contains("ocupado")) {
                  div.classList.toggle("reservado");
                }
              };
              filaDiv.appendChild(div);
            }
            cont.appendChild(filaDiv);
          }
          document.getElementById("btnVenderEmpleado").style.display = "block";
        });
    }

    document.getElementById("btnVenderEmpleado").onclick = function () {
      const reservados = document.querySelectorAll("#asientosEmpleadoContainer .asiento.reservado");
      if (reservados.length === 0) {
        mostrarAlerta("#msgVentaEmpleado", "Selecciona al menos un asiento.", "warning");
        return;
      }
      if (!funcionSeleccionada) {
        mostrarAlerta("#msgVentaEmpleado", "Selecciona una función.", "warning");
        return;
      }
      if (!usuarioSeleccionado) {
        mostrarAlerta("#msgVentaEmpleado", "Selecciona un usuario.", "warning");
        return;
      }
      const nombre = usuarioSeleccionado.nombre;
      const membresia = usuarioSeleccionado.membresia === true;

      const asientos = [];
      reservados.forEach(a => {
        asientos.push({ fila: a.dataset.fila, numero: a.dataset.numero });
      });

      let total = asientos.length * 75;
      let totalOriginal = total;
      if (membresia) {
        total = Math.round(total * 0.9);
      }

      fetch(`${API_URL}/ventas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioId: usuarioSeleccionado._id,
          funcionId: funcionSeleccionada._id,
          total,
          asientos,
          membresia
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.ok) {
            mostrarAlerta("#msgVentaEmpleado", "Venta realizada correctamente", "exito");
            generarAsientosEmpleado(funcionSeleccionada);

            let detalles = `<strong>Cliente:</strong> ${nombre}<br>`;
            detalles += `<strong>Película:</strong> ${funcionSeleccionada.pelicula.titulo}<br>`;
            detalles += `<strong>Sala:</strong> ${funcionSeleccionada.sala.nombre}<br>`;
            detalles += `<strong>Hora:</strong> ${funcionSeleccionada.hora}<br>`;
            detalles += `<strong>Asientos:</strong><br>`;
            asientos.forEach(a => {
              detalles += `${a.fila}-${a.numero}<br>`;
            });
            if (membresia) {
              detalles += `<strong>Subtotal:</strong> $${totalOriginal}<br>`;
              detalles += `<strong>Descuento membresía (10%):</strong> -$${totalOriginal - total}<br>`;
            }
            detalles += `<strong>Total:</strong> $${total}`;
            document.getElementById("msgVentaEmpleado").innerHTML += `<div style="margin-top:18px;background:#23283a;padding:12px;border-radius:8px;">${detalles}</div>`;
          } else {
            mostrarAlerta("#msgVentaEmpleado", data.error || "Error al vender", "error");
          }
        })
        .catch(() => {
          mostrarAlerta("#msgVentaEmpleado", "Error de conexión", "error");
        });
    };
  });
}

// ========== CONSULTAS Y REPORTES ==========

function consultaNumClientes() {
  fetch(`${API_URL}/ventas/clientes`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("contenido-empleado").innerHTML = `
        <h3>Número de clientes atendidos</h3>
        <strong>Total de clientes atendidos:</strong> ${data.numClientes}
        <br><button onclick="mostrarConsultas()" class="btn-action">Volver</button>
      `;
    })
    .catch(() => {
      mostrarAlerta("#contenido-empleado", "Error de conexión", "error", 0);
    });
}

function consultaVentasMembresia(conMembresia) {
  fetch(`${API_URL}/ventas/membresia/${conMembresia}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("contenido-empleado").innerHTML = `
        <h3>Total de ventas a clientes ${conMembresia ? "con" : "sin"} membresía</h3>
        <strong>Cantidad de ventas:</strong> ${data.cantidad}
        <br><button onclick="mostrarConsultas()" class="btn-action">Volver</button>
      `;
    })
    .catch(() => {
      mostrarAlerta("#contenido-empleado", "Error de conexión", "error", 0);
    });
}

function consultaBoletosPorPelicula() {
  fetch(`${API_URL}/ventas/boletos-por-pelicula`)
    .then(res => res.json())
    .then(data => {
      let html = `<div class="consultas-panel"><h3>Total de boletos vendidos por película</h3>`;
      if (!Array.isArray(data) || data.length === 0) {
        html += `<p>No hay ventas registradas.</p>`;
      } else {
        html += `<table><tr><th>Película</th><th>Boletos vendidos</th></tr>`;
        data.forEach(p => {
          html += `<tr><td>${p.titulo}</td><td>${p.boletos}</td></tr>`;
        });
        html += `</table>`;
      }
      html += `<br><button onclick="mostrarConsultas()" class="btn-action">Volver</button></div>`;
      document.getElementById("contenido-empleado").innerHTML = html;
    })
    .catch(() => {
      mostrarAlerta("#contenido-empleado", "Error de conexión", "error", 0);
    });
}

function consultaBoletosPorSala() {
  fetch(`${API_URL}/ventas/boletos-por-sala`)
    .then(res => res.json())
    .then(data => {
      let html = `<div class="consultas-panel"><h3>Total de boletos vendidos por sala</h3>`;
      if (!Array.isArray(data) || data.length === 0) {
        html += `<p>No hay ventas registradas.</p>`;
      } else {
        html += `<table><tr><th>Sala</th><th>Boletos vendidos</th></tr>`;
        data.forEach(s => {
          html += `<tr><td>${s.sala}</td><td>${s.boletos}</td></tr>`;
        });
        html += `</table>`;
      }
      html += `<br><button onclick="mostrarConsultas()" class="btn-action">Volver</button></div>`;
      document.getElementById("contenido-empleado").innerHTML = html;
    })
    .catch(() => {
      mostrarAlerta("#contenido-empleado", "Error de conexión", "error", 0);
    });
}

function consultaPeliculaMasVendida() {
  fetch(`${API_URL}/ventas/pelicula-mas-vendida`)
    .then(res => res.json())
    .then(data => {
      let html = `<h3>Película más vendida</h3>`;
      if (!data || !data.titulo) {
        html += `<p>No hay ventas registradas.</p>`;
      } else {
        html += `<p><strong>${data.titulo}</strong> con <strong>${data.boletos}</strong> boletos vendidos.</p>`;
      }
      html += `<br><button onclick="mostrarConsultas()" class="btn-action">Volver</button>`;
      document.getElementById("contenido-empleado").innerHTML = html;
    })
    .catch(() => {
      mostrarAlerta("#contenido-empleado", "Error de conexión", "error", 0);
    });
}

function consultaPeliculaMenosVendida() {
  fetch(`${API_URL}/ventas/pelicula-menos-vendida`)
    .then(res => res.json())
    .then(data => {
      let html = `<h3>Película menos vendida</h3>`;
      if (!data || !data.titulo) {
        html += `<p>No hay ventas registradas.</p>`;
      } else {
        html += `<p><strong>${data.titulo}</strong> con <strong>${data.boletos}</strong> boletos vendidos.</p>`;
      }
      html += `<br><button onclick="mostrarConsultas()" class="btn-action">Volver</button>`;
      document.getElementById("contenido-empleado").innerHTML = html;
    })
    .catch(() => {
      mostrarAlerta("#contenido-empleado", "Error de conexión", "error", 0);
    });
}

// ========== BOLETOS COMPRADOS BONITO ==========
function mostrarBoletosComprados(funcionId) {
  funcionId = funcionId || window.funcionSeleccionadaId;
  if (!funcionId || !usuarioId) {
    document.getElementById("boletosCompradosUsuario").innerHTML = "";
    return;
  }
  fetch(`${API_URL}/ventas/mis-boletos?usuarioId=${usuarioId}&funcionId=${funcionId}`)
    .then(res => res.json())
    .then(asientos => {
      let html = `
        <div class="boletos-comprados-panel">
          <h3>Boletos ya comprados para esta función:</h3>
          <div class="boletos-comprados-list">
      `;
      if (!asientos || asientos.length === 0) {
        html += `<span style="color:#ffd600;">No tienes boletos comprados para esta función.</span>`;
      } else {
        asientos.forEach(a => {
          html += `<span class="boleto-badge">${a.fila}-${a.numero}</span>`;
        });
      }
      html += `</div></div>`;
      document.getElementById("boletosCompradosUsuario").innerHTML = html;
    });
}
// ========== PDF ==========
function descargarPDF() {
  const detalles = document.getElementById("detallesBoleto").innerText;
  const total = document.getElementById("totalPago").innerText;

  const lines = detalles.split('\n');
  const nombre = lines[0]?.replace(/^\*+|\*+$/g, '').replace("Usuario:", "").trim() || "";
  const pelicula = lines.find(l => l.includes("Película:"))?.split(":")[1]?.trim() || "";
  const sala = lines.find(l => l.includes("Sala:"))?.split(":")[1]?.trim() || "";
  const hora = lines.find(l => l.includes("Hora:"))?.split(":")[1]?.trim() || "";
  const asientos = lines.find(l => l.includes("Asientos:"))?.split(":")[1]?.trim() || "";

  const qrData = `Usuario: ${nombre}\nPelícula: ${pelicula}\nSala: ${sala}\nHora: ${hora}\nAsientos: ${asientos}\n${total}`;

  const qr = new QRious({
    value: qrData,
    size: 100,
    background: 'white'
  });

  const { jsPDF } = window.jspdf;

  let y = 38;
  const tempDoc = new jsPDF({ orientation: "portrait", unit: "mm", format: [80, 140] });
  detalles.split('\n').forEach(line => {
    const linesToPrint = tempDoc.splitTextToSize(line, 56);
    linesToPrint.forEach(() => { y += 8; });
  });
  y += 8;
  y += 34;
  y += 20;

  const pageHeight = Math.max(140, y);
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, pageHeight]
  });

  // Fondo degradado diagonal
  for (let i = 0; i < 80; i++) {
    let ratio = i / 80;
    let r = Math.round(15 + (48 - 15) * ratio);   // de #0f0c29 (15,12,41) a #302b63 (48,43,99)
    let g = Math.round(12 + (43 - 12) * ratio);
    let b = Math.round(41 + (99 - 41) * ratio);
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(1);
    doc.line(i, 0, i, pageHeight);
  }

  // Marco exterior
  doc.setDrawColor(255, 214, 0); // amarillo neón
  doc.setLineWidth(2.5);
  doc.rect(2, 2, 76, pageHeight - 4, "S");

  // Título con sombra
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(183, 33, 255);
  doc.text("Cineee", 41.5, 20.5, { align: "center" });
  doc.setTextColor(255, 214, 0);
  doc.text("Cineee", 40, 19, { align: "center" });

  // Línea decorativa
  doc.setDrawColor(255, 255, 255);
  doc.setLineDashPattern([2, 2], 0);
  doc.setLineWidth(0.7);
  doc.line(10, 25, 70, 25);

  // Detalles
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 255, 255);

  y = 33;
  detalles.split('\n').forEach(line => {
    const linesToPrint = doc.splitTextToSize(line, 56);
    linesToPrint.forEach(l => {
      if (l.includes("Subtotal") || l.includes("Descuento")) {
        doc.setTextColor(109, 213, 237); // celeste neón
        doc.setFont("helvetica", "bold");
      } else if (l.includes("Total")) {
        return;
      } else {
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "normal");
      }
      doc.text(l, 12, y);
      y += 8;
    });
  });

  // Línea antes del total
  doc.setDrawColor(255, 255, 255);
  doc.line(10, y + 4, 70, y + 4);

  // Total en grande
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(183, 33, 255);
  doc.text(total, 41.5, y + 18.5, { align: "center" });
  doc.setTextColor(255, 214, 0);
  doc.text(total, 40, y + 17, { align: "center" });

  // QR code en recuadro celeste
  doc.setDrawColor(109, 213, 237);
  doc.setLineWidth(2);
  doc.rect(24, y + 22, 32, 32, "S");
  doc.addImage(qr.toDataURL(), "PNG", 26, y + 24, 28, 28);

  // Mensaje de agradecimiento
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(183, 33, 255);
  doc.text("¡Gracias por tu compra!", 41.5, y + 65.5, { align: "center" });
  doc.setTextColor(255, 214, 0);
  doc.text("¡Gracias por tu compra!", 40, y + 64, { align: "center" });

  doc.save("boleto.pdf");
}
