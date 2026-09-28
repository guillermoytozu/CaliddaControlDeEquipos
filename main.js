let titulo = document.getElementById('Titulo');
titulo.textContent = 'Hola mundo';
titulo.innerHTML = 'Regalo Secreto <br> Navidad 2026'


let contadorClicks = 0;
let botonFormulario = document.getElementById('boton-formulario');
botonFormulario.addEventListener('click', () => accionClick());

function accionClick() {
    contadorClicks++;
    console.log(contadorClicks);
}