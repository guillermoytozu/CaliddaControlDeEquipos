let titulo = document.getElementById('Titulo');
titulo.textContent = 'Hola mundo';
titulo.innerHTML = 'Regalo Secreto <br> Navidad 2026'


//-------------------------------------------------------------------------------------------------------------

let formulario = document.getElementById('formulario-navidad');
let botonFormulario = document.getElementById('boton-formulario');
formulario.addEventListener('submit', enviarFormulario);

async function enviarFormulario(e) {
    // 1. Evitamos que la página se recargue
    e.preventDefault();

    // Cambiamos el texto del botón
    botonFormulario.textContent = "Enviando...";
    botonFormulario.disabled = true;

    // 2. Capturamos los valores
    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;
    const regalo = document.getElementById('regalo').value;

    // 3. Creamos el objeto JSON
    const datosFormulario = {
        nombre: nombre,
        apellido: apellido,
        regalo: regalo
    };

    console.log("JSON a enviar:", JSON.stringify(datosFormulario));

    // 4. Enviamos los datos
    const urlAPI = "https://script.google.com/macros/s/AKfycbwdR7WPevx7l1e_4OJb3OdCbHVhINYRueYq0WRN5gIsc3QaWSiPYyWsjVn_i8zdqMWv/exec"

    try {
        const respuesta = await fetch(urlAPI, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                // Cambiamos application/json por text/plain
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(datosFormulario)
        });

        // Como usamos 'no-cors', la respuesta es opaca (no podemos leer el estado real),
        // pero si no entró al 'catch', asumimos que el envío se disparó correctamente.
        alert("¡Datos enviados correctamente!");
        formulario.reset();
        cargarRegalos();

    } catch (error) {
        console.error("Error al enviar los datos:", error);
        alert("Hubo un error al enviar los datos.");
    } finally {
        botonFormulario.textContent = "Enviar";
        botonFormulario.disabled = false;
    }

}

//-------------------------------------------------------------------------------------------------------------

// Agrega un contenedor en tu HTML para mostrar la lista (ej. <div id="lista-regalos"></div>)
const contenedorRegalos = document.getElementById('cuerpo-tabla-regalos');

async function cargarRegalos() {
    // Usa exactamente la misma URL que ya tienes para el POST
    const urlAPI = "https://script.google.com/macros/s/AKfycbwdR7WPevx7l1e_4OJb3OdCbHVhINYRueYq0WRN5gIsc3QaWSiPYyWsjVn_i8zdqMWv/exec";

    try {
        // Hacemos la petición GET (no necesita configuraciones extra)
        const respuesta = await fetch(urlAPI);

        // Desempaquetamos el JSON que nos envió Apps Script
        const datos = await respuesta.json();

        console.log("Datos recibidos:", datos);

        // Llamamos a una función para dibujar los datos en el HTML
        dibujarLista(datos);

    } catch (error) {
        console.error("Error al cargar los datos:", error);
        if (contenedorRegalos) {
            contenedorRegalos.innerHTML = "<p>Error al cargar la lista.</p>";
        }
    }
}

function dibujarLista(datos) {
    if (!contenedorRegalos) return;
    contenedorRegalos.innerHTML = "";

    for (let dato of datos) {
        // 1. Creamos un elemento <tr> (fila de tabla), NO un <div>

        console.log(dato);
        const fila = document.createElement('tr');

        // 2. Metemos las 3 columnas (<td>) en esa misma fila
        fila.innerHTML = `
            <td>${dato.nombre}</td>
            <td>${dato.apellido}</td>
            <td>${dato.regalo}</td>
        `;

        // 3. Agregamos la fila terminada al cuerpo de la tabla
        contenedorRegalos.appendChild(fila);
    };
}

// 1. Capturamos los elementos del menú y las vistas
const linkInicio = document.getElementById('Link-inicio');
const linkFotos = document.getElementById('Link-fotos');
const vistaInicio = document.getElementById('vista-inicio');
const vistaFotos = document.getElementById('vista-fotos');

// 2. Evento para el botón de "Fotos Navideñas"
linkFotos.addEventListener('click', (e) => {
    e.preventDefault(); // Evita que el '#' recargue la página o salte hacia arriba

    // Ocultamos el inicio y mostramos las fotos
    vistaInicio.classList.add('oculto');
    vistaFotos.classList.remove('oculto');
});

// 3. Evento para el botón de "Inicio"
linkInicio.addEventListener('click', (e) => {
    e.preventDefault();

    // Ocultamos las fotos y volvemos a mostrar el inicio
    vistaFotos.classList.add('oculto');
    vistaInicio.classList.remove('oculto');
});

// Llamamos a la función para que se ejecute apenas cargue la página
cargarRegalos();


