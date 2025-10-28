// Variables para almacenar los filtros activos
let filtrosActivos = {
    formatos: [],
    idiomas: []
};

// Cuando se hace clic en el botón APLICAR de cines
document.querySelector('#offcanvasCine .btn-aplicar').addEventListener('click', function() {
    const selectedCine = document.querySelector('input[name="select-cine"]:checked');
    if (selectedCine) {
        const label = selectedCine.closest('.list-group-item').querySelector('.form-check-label');
        const cineName = label.childNodes[0].textContent.trim();
        
        document.getElementById('nombreCine').textContent = cineName;
        document.getElementById('cineSeleccionado').style.display = 'block';
        
        const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('offcanvasCine'));
        offcanvas.hide();
    }
});

// Cuando se hace clic en el botón APLICAR de formatos
document.querySelector('#offcanvasFormatos .btn-aplicar').addEventListener('click', function() {
    filtrosActivos.formatos = [];
    if (document.getElementById('formato2d').checked) filtrosActivos.formatos.push('2D');
    if (document.getElementById('formato3d').checked) filtrosActivos.formatos.push('3D');
    if (document.getElementById('formatodb').checked) filtrosActivos.formatos.push('D-BOX');
    
    aplicarFiltros();
    bootstrap.Offcanvas.getInstance(document.getElementById('offcanvasFormatos')).hide();
});

// Cuando se hace clic en el botón APLICAR de idiomas
document.querySelector('#offcanvasIdiomas .btn-aplicar').addEventListener('click', function() {
    filtrosActivos.idiomas = [];
    if (document.getElementById('idiomadob').checked) filtrosActivos.idiomas.push('Doblada');
    if (document.getElementById('idiomasub').checked) filtrosActivos.idiomas.push('Subtitulada');
    if (document.getElementById('idiomaesp').checked) filtrosActivos.idiomas.push('ESPAÑOL');
    
    aplicarFiltros();
    bootstrap.Offcanvas.getInstance(document.getElementById('offcanvasIdiomas')).hide();
});

// Lista de películas disponibles
const peliculas = [
    { titulo: 'Wonka', formato: '2D', idiomas: ['Doblada', 'Subtitulada'], imagen: '../imagenes/peli1.jpg', estreno: true },
    { titulo: 'Five Nights at Freddy\'s', formato: '3D', idiomas: ['Doblada'], imagen: '../imagenes/peli2.jpg', estreno: false },
    { titulo: 'Taylor Swift: The Eras Tour', formato: '2D', idiomas: ['ESPAÑOL', 'Subtitulada'], imagen: '../imagenes/peli3.jpg', estreno: true },
    { titulo: 'Trolls 3', formato: '3D', idiomas: ['Doblada', 'ESPAÑOL'], imagen: '../imagenes/peli4.jpg', estreno: false },
    { titulo: 'Migration', formato: '2D', idiomas: ['Doblada'], imagen: '../imagenes/peli5.jpg', estreno: true },
    { titulo: 'Los Juegos del Hambre', formato: '3D', idiomas: ['Subtitulada'], imagen: '../imagenes/peli6.jpg', estreno: false },
    { titulo: 'Wish', formato: '2D', idiomas: ['Doblada', 'ESPAÑOL'], imagen: '../imagenes/peli7.jpg', estreno: true },
    { titulo: 'Napoleon', formato: '3D', idiomas: ['Subtitulada'], imagen: '../imagenes/peli8.jpg', estreno: false },
    { titulo: 'Aquaman 2', formato: '2D', idiomas: ['Doblada', 'Subtitulada'], imagen: '../imagenes/peli9.jpg', estreno: true },
    { titulo: 'Kung Fu Panda 4', formato: '3D', idiomas: ['Doblada', 'ESPAÑOL'], imagen: '../imagenes/peli10.jpg', estreno: false }
];

// Búsqueda en tiempo real
let searchQuery = '';

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Función para verificar si una película cumple con los filtros
function cumpleFiltros(pelicula) {
    // Si no hay filtros activos, mostrar todas las películas
    const sinFiltrosFormato = filtrosActivos.formatos.length === 0;
    const sinFiltrosIdioma = filtrosActivos.idiomas.length === 0;
    
    // Verificar formato
    const cumpleFormato = sinFiltrosFormato || filtrosActivos.formatos.includes(pelicula.formato);
    
    // Verificar idioma (al menos uno de los idiomas de la película debe estar en los filtros)
    const cumpleIdioma = sinFiltrosIdioma || 
        pelicula.idiomas.some(idioma => filtrosActivos.idiomas.includes(idioma));
    
    return cumpleFormato && cumpleIdioma;
}

// Función para generar películas para un día específico
function generarPeliculasParaDia(contenedor) {
    let peliculasDelDia = [...peliculas]
        .sort(() => Math.random() - 0.5)
        .filter(cumpleFiltros);
    // Si hay búsqueda, filtrar por título, formato o idiomas
    if (searchQuery && searchQuery.trim() !== '') {
        const q = searchQuery.trim().toLowerCase();
        peliculasDelDia = peliculasDelDia.filter(p => {
            const titulo = (p.titulo || '').toLowerCase();
            const formato = (p.formato || '').toLowerCase();
            const idiomas = (p.idiomas || []).join(' ').toLowerCase();
            const esEstreno = p.estreno ? 'estreno' : '';
            return titulo.includes(q) || formato.includes(q) || idiomas.includes(q) || esEstreno.includes(q);
        });
    }
    
    let html = '';
    
    if (peliculasDelDia.length === 0) {
        html = '<div class="col-12 text-center"><p>No hay películas disponibles con los filtros seleccionados</p></div>';
    } else {
        peliculasDelDia.forEach((pelicula) => {
            const href = `Inicio_de_butacas.html?title=${encodeURIComponent(pelicula.titulo)}&image=${encodeURIComponent(pelicula.imagen)}`;
            // resaltar coincidencia si existe búsqueda
            let displayTitle = pelicula.titulo;
            if (searchQuery && searchQuery.trim() !== '') {
                try {
                    const q = searchQuery.trim();
                    const regex = new RegExp('(' + escapeRegExp(q) + ')', 'gi');
                    displayTitle = pelicula.titulo.replace(regex, '<mark>$1</mark>');
                } catch (e) {
                    displayTitle = pelicula.titulo;
                }
            }

            html += `
                <div class="col">
                    <a class="movie-link" href="${href}">
                        <div class="movie-card">
                            <img src="${pelicula.imagen}" alt="${pelicula.titulo}" class="card-img-top">
                            <div class="movie-info">
                                <p class="mb-1 text-center text-truncate">${displayTitle}</p>
                                <p class="movie-format text-center">${pelicula.formato}</p>
                                <p class="movie-language text-center">${pelicula.idiomas.join(' / ')}</p>
                                ${pelicula.estreno ? '<p class="movie-label text-center">Estreno</p>' : ''}
                            </div>
                        </div>
                    </a>
                </div>
            `;
        });
    }
    
    contenedor.querySelector('.row').innerHTML = html;
}

// Generar películas para cada día al cargar la página
document.querySelectorAll('.dia-peliculas').forEach((dia) => {
    generarPeliculasParaDia(dia);
});

// Escuchar input de búsqueda y aplicar filtros en tiempo real
const searchInput = document.getElementById('searchMovies');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value || '';
        aplicarFiltros();
    });
    // limpiar con Esc
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            searchQuery = '';
            aplicarFiltros();
        }
    });
}

// Manejador para los botones de días
document.querySelectorAll('.date-selector .btn').forEach(button => {
    button.addEventListener('click', function() {
        // Remover clase active de todos los botones
        document.querySelectorAll('.date-selector .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Agregar clase active al botón seleccionado
        this.classList.add('active');
        
        // Ocultar todos los contenedores de días
        document.querySelectorAll('.dia-peliculas').forEach(dia => {
            dia.style.display = 'none';
        });
        
        // Mostrar el contenedor correspondiente según el día
        if (this.textContent.includes('28/SEP')) {
            document.getElementById('dia-28').style.display = 'block';
        } else if (this.textContent.includes('29/SEP')) {
            document.getElementById('dia-29').style.display = 'block';
        } else if (this.textContent.includes('30/SEP')) {
            document.getElementById('dia-30').style.display = 'block';
        } else if (this.textContent.includes('1/OCT')) {
            document.getElementById('dia-1').style.display = 'block';
        } else if (this.textContent.includes('2/OCT')) {
            document.getElementById('dia-2').style.display = 'block';
        } else if (this.textContent.includes('3/OCT')) {
            document.getElementById('dia-3').style.display = 'block';
        } else if (this.textContent.includes('4/OCT')) {
            document.getElementById('dia-4').style.display = 'block';
        } else if (this.textContent.includes('5/OCT')) {
            document.getElementById('dia-5').style.display = 'block';
        } else if (this.textContent.includes('6/OCT')) {
            document.getElementById('dia-6').style.display = 'block';
        } else if (this.textContent.includes('7/OCT')) {
            document.getElementById('dia-7').style.display = 'block';
        } else if (this.textContent.includes('8/OCT')) {
            document.getElementById('dia-8').style.display = 'block';
        } else if (this.textContent.includes('9/OCT')) {
            document.getElementById('dia-9').style.display = 'block';
        } else if (this.textContent.includes('10/OCT')) {
            document.getElementById('dia-10').style.display = 'block';
        } else if (this.textContent.includes('HOY')) {
            document.getElementById('dia-hoy').style.display = 'block';
        }
    });
});

// Función para aplicar los filtros y actualizar las películas
function aplicarFiltros() {
    document.querySelectorAll('.dia-peliculas').forEach((dia) => {
        generarPeliculasParaDia(dia);
    });
}

// Generar películas al cargar la página
document.querySelectorAll('.dia-peliculas').forEach((dia) => {
    generarPeliculasParaDia(dia);
});

// Mostrar el día HOY por defecto
document.getElementById('dia-hoy').style.display = 'block';