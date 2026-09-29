let titulo = document.getElementById('Titulo');
titulo.textContent = 'Hola mundo';
titulo.innerHTML = 'Regalo Secreto <br> Navidad 2026'

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

    } catch (error) {
        console.error("Error al enviar los datos:", error);
        alert("Hubo un error al enviar los datos.");
    } finally {
        botonFormulario.textContent = "Enviar";
        botonFormulario.disabled = false;
    }
}


