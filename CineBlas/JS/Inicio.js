document.addEventListener('DOMContentLoaded', () => {
    // Element containers
    const dateSelector = document.getElementById('date-selector');
    const showtimesSection = document.querySelector('.showtimes');

    // Locations to display
    const locations = [
        'COMAS', 'UNI', 'MIRAFLORES', 'SAN ISIDRO', 'SURCO', 'ATE', 'LIMA CENTRO', 'CHORRILLOS', 'SAN MIGUEL'
    ];

    // Base times (in minutes since midnight) per location index (some locations share a base pattern)
    const baseTimesPerLocation = [
        [15*60 + 15, 18*60 + 30, 21*60],            // COMAS
        [15*60 + 15, 17*60],                        // UNI
        [13*60, 16*60 + 45, 20*60 + 10],            // MIRAFLORES
        [14*60 + 30, 19*60],                        // SAN ISIDRO
        [12*60, 15*60 + 30, 18*60 + 15],            // SURCO
        [11*60, 14*60],                             // ATE
        [13*60 + 45, 17*60 + 45],                   // LIMA CENTRO
        [16*60, 19*60 + 30],                        // CHORRILLOS
        [12*60 + 30, 15*60, 21*60 + 45]             // SAN MIGUEL
    ];

    // Helper: format minutes since midnight to 'hh:mm AM/PM'
    function formatTimeFromMinutes(mins) {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setMinutes(mins);
        const opts = { hour: '2-digit', minute: '2-digit' };
        return date.toLocaleTimeString('es-PE', opts);
    }

    // Helper: parse 'HH:MM' (24h) into minutes since midnight
    function parseTimeToMinutes(timeStr) {
        if (!timeStr || typeof timeStr !== 'string') return 0;
        const parts = timeStr.split(':');
        const h = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;
        return h * 60 + m;
    }

    // Create 8 date boxes starting from today
    const today = new Date();
    const daysToShow = 8; // 'Hoy' + next 7 días
    for (let i = 0; i < daysToShow; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);

        const dayLabel = i === 0 ? 'Hoy' : (i === 1 ? 'Mañana' : d.toLocaleDateString('es-ES', { weekday: 'long' }));
        const dayNumber = d.getDate();
        const monthName = d.toLocaleDateString('es-ES', { month: 'long' });
        const iso = d.toISOString().split('T')[0];

        const box = document.createElement('div');
        box.className = 'date-box' + (i === 0 ? ' active' : '');
        box.dataset.date = iso;
    // Insert spaces between label, number and month and capitalize the month name
    const monthCap = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    box.innerHTML = `<span class="day-label">${dayLabel}</span>&nbsp;<span class="day-number">${dayNumber}</span>&nbsp;<span class="month">${monthCap}</span>`;

        // Tooltip: mostrar la fecha completa al pasar el cursor. Usamos el locale 'es-PE'.
        box.addEventListener('click', () => {
            document.querySelectorAll('.date-box').forEach(b => b.classList.remove('active'));
            box.classList.add('active');
            renderShowtimesForOffset(i);
        });

        dateSelector.appendChild(box);
    }

    // No inicializamos tooltips en las cajas de fecha: el usuario prefirió que no aparezca
    // ningún cuadro de texto al acercar el cursor. Si en el futuro se desea reactivar,
    // volver a agregar atributos `title` / `data-bs-toggle` y esta inicialización.

    // Render showtimes for a specific day offset from today
    function renderShowtimesForOffset(offset) {
        showtimesSection.innerHTML = ''; // clear

        // Keep movie/title params for buy links
        const params = new URLSearchParams(window.location.search);
        const title = params.get('title') ? decodeURIComponent(params.get('title')) : 'Película';
        const image = params.get('image') ? decodeURIComponent(params.get('image')) : '../imagenes/placeholder.png';

        locations.forEach((loc, idx) => {
            const container = document.createElement('div');
            container.className = 'location-group mb-4';
            container.dataset.location = loc;

            const h2 = document.createElement('h2');
            h2.className = 'location-name fs-6 fw-bold mb-2';
            h2.textContent = loc;
            container.appendChild(h2);

            const timesContainer = document.createElement('div');
            timesContainer.className = 'times-container d-flex flex-wrap gap-3';

            // get base times for this location (from SHOWTIMES_DATA if available, otherwise fallback)
            let base = baseTimesPerLocation[idx] || [12*60, 15*60, 18*60];
            // Prefer explicit per-date schedules if provided
            const dateIso = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset).toISOString().split('T')[0];
            if (window && window.SHOWTIMES_BY_DATE && window.SHOWTIMES_BY_DATE[dateIso] && window.SHOWTIMES_BY_DATE[dateIso][loc]) {
                try {
                    base = window.SHOWTIMES_BY_DATE[dateIso][loc].map(parseTimeToMinutes);
                } catch (ex) {}
            } else if (window && window.SHOWTIMES_DATA && window.SHOWTIMES_DATA[loc]) {
                // convert incoming 'HH:MM' strings to minutes
                try {
                    base = window.SHOWTIMES_DATA[loc].map(parseTimeToMinutes);
                } catch (ex) {
                    // fall back silently
                }
            }

            // No daily variation: usar los horarios tal cual (por fecha si existe SHOWTIMES_BY_DATE,
            // o los horarios base de SHOWTIMES_DATA / baseTimesPerLocation). Las fechas se actualizan
            // dinámicamente pero los horarios permanecen constantes.
            const timesToUse = base;

            timesToUse.forEach(mins => {
                const timeLabel = formatTimeFromMinutes(mins);

                const btn = document.createElement('button');
                btn.className = 'time-button';
                btn.dataset.time = timeLabel;
                btn.innerHTML = `${timeLabel} <a class="buy-link d-flex align-items-center mt-1">🛒 Comprar</a>`;

                // clicking the button (not the buy link) highlights briefly
                btn.addEventListener('click', (e) => {
                    if (e.target.closest('.buy-link')) return;
                    btn.style.backgroundColor = '#ffd6d6';
                    setTimeout(() => btn.style.backgroundColor = '', 400);
                });

                // configure buy link to carry title, image, time, date and location
                const buyAnchor = btn.querySelector('.buy-link');
                if (buyAnchor) {
                    const dateIso = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset).toISOString().split('T')[0];
                    // set href as fallback for users without JS or middle-click
                    buyAnchor.href = `Butacas.html?title=${encodeURIComponent(title)}&image=${encodeURIComponent(image)}&time=${encodeURIComponent(timeLabel)}&date=${encodeURIComponent(dateIso)}&location=${encodeURIComponent(loc)}`;

                    // Prefer behaviour: save selection in localStorage and redirect
                    buyAnchor.addEventListener('click', (e) => {
                        // prevent default navigation; we'll redirect after saving
                        e.preventDefault();
                        const selection = {
                            title: title,
                            image: image,
                            time: timeLabel,
                            date: dateIso,
                            location: loc
                        };
                        try {
                            localStorage.setItem('selectedShow', JSON.stringify(selection));
                        } catch (ex) {
                            // ignore storage errors
                        }
                        // Redirect to Butacas (will be able to read localStorage)
                        window.location.href = 'Butacas.html';
                    });
                }

                timesContainer.appendChild(btn);
            });

            container.appendChild(timesContainer);
            showtimesSection.appendChild(container);
        });
    }

    // Initial render for today
    renderShowtimesForOffset(0);
});
// The dynamic renderer above already reads URL params and sets buy links when creating buttons.