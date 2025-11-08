document.addEventListener('DOMContentLoaded', () => {
    // ------------------------------------------
    // Lógica para Selección de Fechas (si existe)
    // ------------------------------------------
    const dateBoxes = document.querySelectorAll('.date-box');

    dateBoxes.forEach(box => {
        box.addEventListener('click', () => {
            // 1. Quitar la clase 'active' de todos los cuadros de fecha
            dateBoxes.forEach(b => b.classList.remove('active'));

            // 2. Agregar la clase 'active' al cuadro que fue clickeado
            box.classList.add('active');

            console.log('Fecha seleccionada:', box.dataset.date);
        });
    });

    // Opcional: Agregar manejo de clics a los botones de horario
    const timeButtons = document.querySelectorAll('.time-button');
    timeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            if (!e.target.closest('.buy-link')) {
                const location = button.closest('.location-group').querySelector('h2').textContent;
                const time = button.dataset.time;
                console.log(`Intento de compra para: ${time} en ${location}`);
            }
        });
    });
});

// ------------------------------------------
// Lógica de Google Maps y Sucursales en Modal
// ------------------------------------------

// Función para cargar Google Maps JS de forma dinámica (reutilizable)
function loadGoogleMaps(apiKey) {
    if (window.google && window.google.maps) return Promise.resolve(window.google.maps);
    if (window.__gmapsLoading) return window.__gmapsLoading;

    window.__gmapsLoading = new Promise((resolve, reject) => {
        window.__initGMaps = function() { resolve(window.google.maps); delete window.__initGMaps; };
        const s = document.createElement('script');
        // Usar encodeURIComponent para la clave API, aunque no es estrictamente necesario, es buena práctica
        s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=__initGMaps`; 
        s.async = true; s.defer = true;
        s.onerror = () => reject(new Error('No se pudo cargar la librería de Google Maps'));
        document.head.appendChild(s);
    });
    return window.__gmapsLoading;
}

// Función que muestra una dirección en el mapa con marcador e InfoWindow
function showCinemaOnMap(cinemaName, address) {
    const loader = document.querySelector('gmpx-api-loader');
    const apiKey = loader ? loader.getAttribute('key') : null;
    const mapContainer = document.getElementById('apiMapContainer');
    const modalLabel = document.getElementById('mapaModalLabel');
    const mapAddressText = document.getElementById('mapAddressText');

    if (modalLabel) modalLabel.textContent = `Ubicación: ${cinemaName}`;
    if (mapAddressText) mapAddressText.textContent = 'Buscando dirección...';

    if (!address || !apiKey) {
        if (mapAddressText) mapAddressText.textContent = 'Dirección o API key no disponible.';
        return;
    }

    loadGoogleMaps(apiKey).then(() => {
        try {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ address: address }, (results, status) => {
                if (status !== 'OK' || !results || results.length === 0) {
                    if (mapAddressText) mapAddressText.textContent = 'No se encontró la ubicación exacta.';
                    return;
                }
                const r = results[0];
                const formatted = r.formatted_address;
                const loc = r.geometry.location; // LatLng

                if (mapAddressText) mapAddressText.innerHTML = `<strong>${formatted}</strong><br><span class="small text-muted">Lat: ${loc.lat().toFixed(6)}, Lng: ${loc.lng().toFixed(6)}</span>`;

                // Reusar o crear mapa
                if (!window.__cineMap) {
                    window.__cineMap = new google.maps.Map(mapContainer, { center: loc, zoom: 16 });
                } else {
                    window.__cineMap.setCenter(loc);
                    window.__cineMap.setZoom(16);
                }

                // Remover marcador previo
                if (window.__cineMarker) {
                    window.__cineMarker.setMap(null);
                    window.__cineMarker = null;
                }

                // Crear marcador
                window.__cineMarker = new google.maps.Marker({ position: loc, map: window.__cineMap, title: cinemaName || formatted });

                // Crear y abrir InfoWindow (globo)
                const infoContent = `<div style="min-width:180px;padding:8px;font-size:14px;"><strong>${(cinemaName || formatted)}</strong><div style="font-size:12px;color:#666;margin-top:4px;">${formatted}</div></div>`;
                if (window.__cineInfoWindow) { window.__cineInfoWindow.close(); }
                window.__cineInfoWindow = new google.maps.InfoWindow({ content: infoContent, position: loc });
                window.__cineInfoWindow.open(window.__cineMap, window.__cineMarker);

                // Abrir InfoWindow al hacer click en el marcador
                window.__cineMarker.addListener('click', () => {
                    if (window.__cineInfoWindow) window.__cineInfoWindow.open(window.__cineMap, window.__cineMarker);
                });

                // Trigger resize event after map is loaded and centered
                google.maps.event.trigger(window.__cineMap, 'resize');
            });
        } catch (err) {
            console.error('Error al usar Google Maps JS:', err);
            if (mapAddressText) mapAddressText.textContent = 'Error al inicializar el mapa.';
        }
    }).catch(err => {
        console.error('No se pudo cargar Google Maps JS:', err);
        if (mapAddressText) mapAddressText.textContent = 'No se pudo cargar el mapa. Compruebe la API key.';
    });
}

// Poblar la lista de sucursales dentro del modal
function populateBranchesList(selectedAddress) {
    const list = document.getElementById('branchesList');
    if (!list) return;
    list.innerHTML = ''; // Limpiar lista previa

    const cards = document.querySelectorAll('.cinema-card');
    cards.forEach((card) => {
        const nameEl = card.querySelector('.cinema-name');
        const btn = card.querySelector('.btn-mapa');
        const name = nameEl ? nameEl.textContent.trim() : 'Sucursal';
        const address = btn ? (btn.getAttribute('data-address') || '') : '';

        const item = document.createElement('button');
        item.type = 'button';
        // Usar 'list-group-item-action' para darle estilo de botón navegable de Bootstrap
        item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-start';
        item.innerHTML = `<div class="ms-2 me-auto"><div class="fw-bold">${name}</div><div class="small text-muted">${address}</div></div>`;
        item.dataset.address = address;
        item.dataset.name = name;

        // Marcar la sucursal que fue clickeada inicialmente
        if (selectedAddress && selectedAddress === address) item.classList.add('active');

        item.addEventListener('click', () => {
            // Quitar 'active' de todos y agregar a este ítem
            list.querySelectorAll('.active').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            showCinemaOnMap(name, address); // Actualiza la ubicación del mapa
        });

        list.appendChild(item);
    });
}

// Escuchar clicks en botones .btn-mapa para abrir modal, poblar lista y mostrar el cine seleccionado
document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('.btn-mapa');
    if (!btn) return;
    e.preventDefault();

    // Obtener datos del cine
    const address = btn.getAttribute('data-address') || btn.dataset.address || '';
    const cinemaName = btn.closest('.cinema-info') ? btn.closest('.cinema-info').querySelector('.cinema-name').textContent.trim() : '';

    // Poblar la lista de sucursales en el modal
    populateBranchesList(address);

    // Actualizar el enlace de "Cómo llegar" en el modal
    setTimeout(() => {
        showCinemaOnMap(cinemaName, address);

        // Actualizar el botón de "Cómo llegar" con el enlace de Google Maps
        const directionsBtn = document.querySelector('.get-directions');
        if (directionsBtn) {
            // Codificar la dirección para URL
            const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
            directionsBtn.href = gmapsUrl;
            directionsBtn.setAttribute('aria-label', `Cómo llegar a ${cinemaName}`);
        }
    }, 300); // 300ms es un buen margen para la animación del modal
});