let nombreUsuario = "";

const API_URL = "http://localhost:3000/api";

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
      alert(data.error || "Error al iniciar sesión.");
    }
  } else {
    alert("Ingrese usuario y contraseña");
  }
}

function cerrarSesion() {
  nombreUsuario = "";
  document.getElementById("login").style.display = "block";
  document.getElementById("salas").style.display = "none";
  document.getElementById("panel-empleado").style.display = "none";
  document.getElementById("logout").style.display = "none";
  document.getElementById("ticket").style.display = "none";
  document.getElementById("usuario").value = "";
  document.getElementById("contrasena").value = "";
}

// ========== USUARIO: SELECCIÓN DE FUNCIÓN Y ASIENTOS ==========
function cargarFuncionesUsuario() {
  fetch(`${API_URL}/funciones`)
    .then(res => res.json())
    .then(funciones => {
      const select = document.getElementById("funcionSeleccion");
      if (!select) return;
      select.innerHTML = `<option disabled selected>Seleccione función</option>`;
      if (Array.isArray(funciones)) {
        funciones.forEach(f => {
          if (f.pelicula && f.sala) {
            select.innerHTML += `<option value="${f._id}">${f.pelicula.titulo} - Sala ${f.sala.nombre} - ${f.hora}</option>`;
          }
        });
      } else {
        // Muestra el error en consola
        console.error('Error al cargar funciones:', funciones);
      }
    });
}

function generarAsientosUsuario() {
  const funcionId = document.getElementById("funcionSeleccion").value;
  const cont = document.getElementById("asientosContainer");
  cont.innerHTML = "";
  if (!funcionId) return;

  const filas = [];
  for (let i = 0; i < 10; i++) filas.push(String.fromCharCode(65 + i));
  const asientosPorFila = 7;

  fetch(`${API_URL}/ventas/tickets?funcionId=${funcionId}`)
    .then(res => res.json())
    .then(asientosOcupados => {
      const ocupadosSet = new Set(asientosOcupados.map(a => `${a.fila}-${a.numero}`));
      for (let fila of filas) {
        const filaDiv = document.createElement("div");
        filaDiv.style.marginBottom = "8px";
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
  const funcionId = document.getElementById("funcionSeleccion").value;
  const reservados = document.querySelectorAll("#asientosContainer .asiento.reservado");
  if (!funcionId || reservados.length === 0) {
    alert("Selecciona una función y al menos un asiento.");
    return;
  }
  const asientos = [];
  reservados.forEach(a => {
    asientos.push({ fila: a.dataset.fila, numero: a.dataset.numero });
  });
  let total = asientos.length * 75;

  fetch(`${API_URL}/ventas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      usuarioId: null,
      funcionId,
      total,
      asientos,
      membresia: false
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.ok) {
        document.getElementById("ticket").style.display = "block";
        document.getElementById("detallesBoleto").innerHTML = `Función: ${funcionId}<br>Asientos: ${asientos.map(a => `${a.fila}-${a.numero}`).join(", ")}`;
        document.getElementById("totalPago").textContent = "Total: $" + total;
        generarAsientosUsuario();
      } else {
        alert(data.error || "Error al comprar.");
      }
    });
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

function mostrarRegistro() {
  document.getElementById("login").style.display = "none";
  document.getElementById("registro").style.display = "block";
}

function cancelarRegistro() {
  document.getElementById("registro").style.display = "none";
  document.getElementById("login").style.display = "block";
}

async function registrarUsuario() {
  const nombre = document.getElementById("nombreRegistro").value;
  const email = document.getElementById("emailRegistro").value;
  const contraseña = document.getElementById("contrasenaRegistro").value;

  if (nombre && email && contraseña) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, contraseña })
    });
    const data = await res.json();
    if (res.ok) {
      alert("Registro exitoso. Ahora puedes iniciar sesión.");
      cancelarRegistro();
    } else {
      alert(data.error || "Error al registrar usuario.");
    }
  } else {
    alert("Completa todos los campos para registrarte.");
  }
}

function registrar() {
  mostrarRegistro();
}

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
      <label>¿Tiene membresía?
        <select id="nuevoMembresia" required>
          <option value="0">No</option>
          <option value="1">Sí</option>
        </select>
      </label>
      <button type="submit">Crear Usuario</button>
    </form>
    <div id="msgCrearUsuario" style="margin-top:10px;"></div>
  `;

  document.getElementById("formCrearUsuario").onsubmit = function(e) {
    e.preventDefault();
    const nombre = document.getElementById("nuevoUsuario").value.trim();
    const email = document.getElementById("nuevoEmail").value.trim();
    const contraseña = document.getElementById("nuevoContrasena").value;
    const rol = document.getElementById("nuevoRol").value;
    const membresia = document.getElementById("nuevoMembresia").value === "1";
    fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, email, contraseña, rol, membresia })
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          document.getElementById("msgCrearUsuario").innerHTML = `<span style="color:limegreen;">Usuario creado correctamente</span>`;
        } else {
          document.getElementById("msgCrearUsuario").innerHTML = `<span style="color:red;">${data.error || "Error al crear usuario"}</span>`;
        }
      })
      .catch(() => {
        document.getElementById("msgCrearUsuario").innerHTML = `<span style="color:red;">Error de conexión</span>`;
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
      fetch(`${API_URL}/funciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peliculaId, salaId, hora })
      })
        .then(res => res.json())
        .then(data => {
          if (data.ok) {
            document.getElementById("msgFuncion").innerHTML = `<span style="color:limegreen;">Función agregada correctamente</span>`;
          } else {
            document.getElementById("msgFuncion").innerHTML = `<span style="color:red;">${data.error || "Error al agregar función"}</span>`;
          }
        })
        .catch(() => {
          document.getElementById("msgFuncion").innerHTML = `<span style="color:red;">Error de conexión</span>`;
        });
    };
  });
}

function mostrarConsultas() {
  document.getElementById("contenido-empleado").innerHTML = `
    <h3>Consultas y Reportes</h3>
    <ul>
      <li><button onclick="consultaTotalVentas()">Total de ventas realizadas</button></li>
      <li><button onclick="consultaNumClientes()">Número de clientes atendidos</button></li>
      <li><button onclick="consultaVentasMembresia(true)">Total ventas a clientes con membresía</button></li>
      <li><button onclick="consultaVentasMembresia(false)">Total ventas a clientes sin membresía</button></li>
      <li><button onclick="consultaBoletosPorPelicula()">Total de boletos vendidos por película</button></li>
      <li><button onclick="consultaBoletosPorSala()">Total de boletos vendidos por sala</button></li>
      <li><button onclick="consultaPeliculaMasVendida()">Película más vendida</button></li>
      <li><button onclick="consultaPeliculaMenosVendida()">Película menos vendida</button></li>
    </ul>
    <div id="resultadoConsulta"></div>
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
    fetch(`${API_URL}/salas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre })
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          document.getElementById("msgSala").innerHTML = `<span style="color:limegreen;">Sala agregada correctamente</span>`;
        } else {
          document.getElementById("msgSala").innerHTML = `<span style="color:red;">${data.error || "Error al agregar sala"}</span>`;
        }
      })
      .catch(() => {
        document.getElementById("msgSala").innerHTML = `<span style="color:red;">Error de conexión</span>`;
      });
  };
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
    fetch(`${API_URL}/peliculas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, categoria })
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          document.getElementById("msgPelicula").innerHTML = `<span style="color:limegreen;">Película agregada correctamente</span>`;
        } else {
          document.getElementById("msgPelicula").innerHTML = `<span style="color:red;">${data.error || "Error al agregar película"}</span>`;
        }
      })
      .catch(() => {
        document.getElementById("msgPelicula").innerHTML = `<span style="color:red;">Error de conexión</span>`;
      });
  };
}

function mostrarVentaEmpleado() {
  fetch(`${API_URL}/funciones`)
    .then(res => res.json())
    .then(funciones => {
      if (!funciones.length) {
        document.getElementById("contenido-empleado").innerHTML = "<h3>No hay funciones disponibles</h3>";
        return;
      }
      let html = `
        <h3>Venta de Boletos (Taquilla)</h3>
        <form id="formVentaEmpleado">
          <label>Nombre del cliente:</label>
          <input type="text" id="nombreCliente" required>
          <label>¿Tiene membresía?</label>
          <select id="membresiaCliente" required>
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
        <button id="btnVenderEmpleado" style="display:none;">Vender</button>
        <div id="msgVentaEmpleado"></div>
      `;
      document.getElementById("contenido-empleado").innerHTML = html;

      let funcionSeleccionada = null;

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
              filaDiv.style.marginBottom = "8px";
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
          document.getElementById("msgVentaEmpleado").innerHTML = `<span style="color:red;">Selecciona al menos un asiento.</span>`;
          return;
        }
        if (!funcionSeleccionada) {
          document.getElementById("msgVentaEmpleado").innerHTML = `<span style="color:red;">Selecciona una función.</span>`;
          return;
        }
        const nombre = document.getElementById("nombreCliente").value.trim();
        const membresia = document.getElementById("membresiaCliente").value === "1";

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
            usuarioId: null,
            funcionId: funcionSeleccionada._id,
            total,
            asientos,
            membresia
          })
        })
          .then(res => res.json())
          .then(data => {
            if (data.ok) {
              document.getElementById("msgVentaEmpleado").innerHTML = `<span style="color:limegreen;">Venta realizada correctamente</span>`;
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
              document.getElementById("msgVentaEmpleado").innerHTML = `<span style="color:red;">${data.error || "Error al vender"}</span>`;
            }
          })
          .catch(() => {
            document.getElementById("msgVentaEmpleado").innerHTML = `<span style="color:red;">Error de conexión</span>`;
          });
      };
    });
}
