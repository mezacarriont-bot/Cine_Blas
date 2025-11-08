// Mapeo de imágenes a URLs de tráilers
const trailerUrls = {
    '1.jpg': 'https://www.youtube.com/watch?v=Ke1Y3P9D0Bc',
    '2.jpg': 'https://www.youtube.com/watch?v=Go8nTmfrQd8',
    '3.jpg': 'https://www.youtube.com/watch?v=H84al-zYhq8',
    '4.jpg': 'https://www.youtube.com/watch?v=m7o2PwM8fCs',
    '5.jpg': 'https://www.youtube.com/watch?v=ezSKM7MZIx0',
    '6.jpg': 'https://www.youtube.com/watch?v=HMujt32gLUo',
    '7.jpg': 'https://www.youtube.com/watch?v=bsoJaQ2gZh4',
    '8.jpg': 'https://www.youtube.com/watch?v=xw1vQgVaYNQ',
    '9.jpg': 'https://www.youtube.com/watch?v=hbfadtw-fjs',
    '10.jpeg': 'https://www.youtube.com/watch?v=v8w6F5g-_E0',
    '11.jpg': 'https://www.youtube.com/watch?v=-ci-E7YL4yM',
    '12.jpg': 'https://www.youtube.com/watch?v=6ZfuNTqbHE8',
    '13.jpg': 'https://www.youtube.com/watch?v=PyakRSni-c0',
    '14.jpg': 'https://www.youtube.com/watch?v=_inKs4eeHiI',
    '15.avif': 'https://www.youtube.com/watch?v=B1Z0BjA4TSc',
    '17.webp': 'https://www.youtube.com/watch?v=TB72bNlQmSc',
    '18.jpg': 'https://www.youtube.com/watch?v=eO0T9A3kdqc',
    '19.jpg': 'https://www.youtube.com/watch?v=sld2-fE_Wng',
    '20.jpg': 'https://www.youtube.com/watch?v=b_1w1ZvZoLQ',
    '21.webp': 'https://www.youtube.com/watch?v=gMVsBMq_b_M',
    '22.jpg': 'https://www.youtube.com/watch?v=AXbE-_VcMBc',
    '23.jpg': 'https://www.youtube.com/watch?v=-Wux16EFEL4',
    '24.jpg': 'https://www.youtube.com/watch?v=73_1biulkYk',
    '25.jpg': 'https://www.youtube.com/watch?v=FEa9pPqGhPY',
    '26.jpeg': 'https://www.youtube.com/watch?v=i7F8JorsJgk',
    '27.jpg': 'https://www.youtube.com/watch?v=_OKAwz2MsJs',
    '28.jpg': 'https://www.youtube.com/watch?v=7abcOLrJxJU',
    '29.webp': 'https://www.youtube.com/watch?v=XtFI7SNtVpY',
    '30.jpg': 'https://www.youtube.com/watch?v=FVswuip0-co',
    '31.jpg': 'https://www.youtube.com/watch?v=VuCEYInNNKg',
    '32.jpg': 'https://www.youtube.com/watch?v=hdUHcfU9hFU',
    '33.jpg': 'https://www.youtube.com/watch?v=BAn28Pmc58c',
    '35.jpg': 'https://www.youtube.com/watch?v=xiC2iXTXHxw'
};

// Función para extraer el ID del video de YouTube de la URL
function getYouTubeVideoId(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : false;
}

//Función para mostrar el tráiler en un modal
function showTrailer(arg) {
    // Soporta varios tipos de entrada:
    // - string: ruta/URL de la imagen (o nombre de archivo)
    // - evento (click): se busca la imagen con id 'movie-poster' o el target.img
    // - elemento <img>
    let imgSrc = null;

    // Si nos pasan un string asumimos que es la src de la imagen
    if (typeof arg === 'string') {
        imgSrc = arg;
    } else if (arg && arg.tagName && arg.tagName.toLowerCase() === 'img') {
        imgSrc = arg.src;
    } else if (arg && typeof arg.preventDefault === 'function') {
        // Es probablemente un evento: prevenir comportamiento por defecto
        try { arg.preventDefault(); } catch (e) {}

        // Si el target es una imagen, usarla
        if (arg.target && arg.target.tagName && arg.target.tagName.toLowerCase() === 'img') {
            imgSrc = arg.target.src;
        } else {
            // Fallback: buscar el póster principal en la página
            const imgElement = document.getElementById('movie-poster');
            if (imgElement) imgSrc = imgElement.getAttribute('src');
        }
    } else {
        // Último recurso: buscar el póster principal en la página
        const imgElement = document.getElementById('movie-poster');
        if (imgElement) imgSrc = imgElement.getAttribute('src');
    }

    if (!imgSrc) return;

    const fileName = imgSrc.split('/').pop();
    const trailerUrl = trailerUrls[fileName];
    if (!trailerUrl) return;

    const videoId = getYouTubeVideoId(trailerUrl);
    if (!videoId) return;

    const modal = document.getElementById('trailerModal');
    const iframe = document.getElementById('trailerIframe');
    
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    if (modal) modal.style.display = 'block';
}

// Función para cerrar el modal
function closeTrailerModal() {
    const modal = document.getElementById('trailerModal');
    const iframe = document.getElementById('trailerIframe');
    iframe.src = '';
    modal.style.display = 'none';
}

// Inicializar los event listeners cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Agregar botones de tráiler a las tarjetas de película si existen
    document.querySelectorAll('.movie-card').forEach(card => {
        const img = card.querySelector('img');
        if (!img) return;

        const trailerBtn = document.createElement('button');
        trailerBtn.className = 'btn btn-trailer';
        trailerBtn.innerHTML = '<i class="fas fa-play"></i> Ver Tráiler';
        trailerBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            showTrailer(img.src);
        };
        card.appendChild(trailerBtn);
    });

    // Cerrar el modal cuando se hace clic fuera del video
    const trailerModal = document.getElementById('trailerModal');
    if (trailerModal) {
        trailerModal.onclick = (e) => {
            if (e.target === trailerModal) {
                closeTrailerModal();
            }
        };

        // También cerrar con la tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && trailerModal.style.display === 'block') {
                closeTrailerModal();
            }
        });
    }
});