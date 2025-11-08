document.addEventListener('DOMContentLoaded', () => {
    // --- Configuración de Datos ---
    const TICKET_PRICES = {
        ADULTO: 18.50,
        NINO: 15.00,
        ADULTO_MAYOR: 10.00,
        ESTUDIANTE: 12.00
    };

    const SNACK_ITEMS = {
        popcorn: [
            { id: 'PC_CHICO', name: 'POP CORN SALADO CHICO', price: 11.00, img: 'canchita_mediana.png' },
            { id: 'PC_MEDIANO', name: 'POP CORN MEDIANO SALADO', price: 12.00, img: 'canchita_mediana.png' }
        ],
        bebidas: [
            { id: 'G_CHICO', name: 'GASEOSA VASO CHICO', price: 8.00, img: 'coca_cola.jpg' },
            { id: 'G_MEDIANO', name: 'GASEOSA VASO MEDIANO', price: 10.00, img: 'coca_cola.jpg' }
        ]
    };

    // --- Variables de Estado Global ---
    let currentStep = 1; 
    let selectedSeats = []; 
    let ticketCounts = {}; 
    let snackCounts = {}; 
    let timeLeft = 5 * 60; // 5 minutos
    let timerInterval; 

    Object.keys(TICKET_PRICES).forEach(key => ticketCounts[key] = 0);

    // --- Referencias DOM ---
    const stepContents = document.querySelectorAll('.step-content');
    const stepButtons = document.querySelectorAll('#step-bar button');
    const selectedSeatsDisplay = document.getElementById('selected-seats-display');
    const seatMapContainer = document.getElementById('seat-map');
    const btnSiguienteButacas = document.querySelector('.step-content[data-step="1"] .btn-siguiente');
    const ticketListContainer = document.getElementById('ticket-list');
    const totalEntradasDisplay = document.getElementById('total-entradas');
    const btnSiguienteEntradas = document.querySelector('.step-content[data-step="2"] .btn-siguiente');
    const totalSnacksDisplay = document.getElementById('total-snacks');
    const totalGeneralDisplay = document.getElementById('total-general');
    const btnAtras = document.getElementById('btn-atras');
    const resumenLista = document.getElementById('resumen-lista');
    const ticketValidationMsg = document.getElementById('ticket-validation-msg');
    const currentTimeDisplay = document.getElementById('current-time-display');
    const header = document.querySelector('header');
    const currentEntryDateDisplay = document.getElementById('current-entry-date');
    const currentEntryTimeDisplay = document.getElementById('current-entry-time');

    // REFERENCIAS PARA EL MODAL DE PAGO (Formulario)
    const btnIniciarPago = document.getElementById('btn-iniciar-pago');
    const paymentModalElement = document.getElementById('paymentModal');
    const modalTotalPagoDisplay = document.getElementById('modal-total-pago');
    const paymentModal = new bootstrap.Modal(paymentModalElement); 


    // --- Lógica de Hora de Ingreso (Panel Lateral) ---
    function displayEntryTime() {
        // Obtenemos la fecha y hora actual (27 de octubre de 2025, 03:15 PM)
        const now = new Date();
        
        // Simulación de la fecha específica que aparecía en las imágenes
        // const entryDate = new Date(2025, 9, 27, 15, 15, 0); // Mes es 0-indexado, Octubre es 9.

        const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        // Usamos la hora actual para simular el ingreso, pero se podría usar 'entryDate' si se quiere la hora fija.
        const formattedDate = now.toLocaleDateString('es-PE', dateOptions); 
        
        const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
        const formattedTime = now.toLocaleTimeString('es-PE', timeOptions);

        if (currentEntryDateDisplay) {
            currentEntryDateDisplay.innerHTML = `📅 Ingreso: ${formattedDate}`; 
        }
        if (currentEntryTimeDisplay) {
            currentEntryTimeDisplay.innerHTML = `🕒 ${formattedTime}`;
        }
    }


    // --- Lógica del Temporizador de Sesión (Barra superior) ---

    function updateClock() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        if (currentTimeDisplay) {
            currentTimeDisplay.textContent = ` 🕒 ${formattedTime}`;
        }
        
        if (timeLeft <= 60 && timeLeft > 0) {
            header.classList.add('bg-warning', 'text-dark');
            header.classList.remove('bg-danger', 'text-white');
        } else if (timeLeft > 60) {
            header.classList.add('bg-danger', 'text-white');
            header.classList.remove('bg-warning', 'text-dark');
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            currentTimeDisplay.textContent = ` ❌ SESIÓN EXPIRADA`;
            header.classList.remove('bg-warning');
            header.classList.add('bg-dark', 'text-white');
            alert('¡Tu sesión ha expirado! Serás redirigido.');
        } else {
            timeLeft--;
        }
    }


    // --- Utilidades y Lógica de Pasos ---

    function getSnackById(id) {
        const allSnacks = [...SNACK_ITEMS.popcorn, ...SNACK_ITEMS.bebidas];
        return allSnacks.find(snack => snack.id === id);
    }
    
    function generateSeatMap() {
        const rows = 'PNMLKJIHGFEDCBA'; 
        const colsLeft = [14, 13, 12, 11, 10, 9, 8, 7]; 
        const colsRight = [6, 5, 4, 3, 2, 1]; 

        seatMapContainer.innerHTML = '';
        const seatGrid = document.createElement('div');
        seatGrid.className = 'seat-grid';
        const seatRowsContainer = document.createElement('div');
        seatRowsContainer.className = 'seat-rows-container';
        const rowLabelsRight = document.createElement('div');
        rowLabelsRight.className = 'row-labels-right';

        rows.split('').forEach(rowLetter => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'seat-row';
            const label = document.createElement('div');
            label.className = 'row-label';
            label.textContent = rowLetter;
            rowLabelsRight.appendChild(label); 
            
            colsLeft.forEach(colNumber => {
                const seatId = rowLetter + String(colNumber).padStart(2, '0');
                rowDiv.appendChild(createSeatElement(seatId));
            });

            const aisleSpacer = document.createElement('div');
            aisleSpacer.className = 'aisle-spacer';
            rowDiv.appendChild(aisleSpacer);

            colsRight.forEach(colNumber => {
                const seatId = rowLetter + String(colNumber).padStart(2, '0');
                rowDiv.appendChild(createSeatElement(seatId));
            });
            
            seatRowsContainer.appendChild(rowDiv);
        });

        seatGrid.appendChild(seatRowsContainer);
        seatGrid.appendChild(rowLabelsRight);
        seatMapContainer.appendChild(seatGrid);
    }

    function createSeatElement(id) {
        const seat = document.createElement('div');
        seat.className = 'seat';
        seat.setAttribute('data-seat-id', id);
        seat.addEventListener('click', toggleSeatSelection);
            if (selectedSeats.includes(id)) {
                seat.classList.add('selected');
            }        return seat;
    }

    function toggleSeatSelection(event) {
        const seat = event.target;
        const seatId = seat.getAttribute('data-seat-id');

        if (seat.classList.contains('selected')) {
            seat.classList.remove('selected');
            selectedSeats = selectedSeats.filter(id => id !== seatId);
        } else {
            seat.classList.add('selected');
            selectedSeats.push(seatId);
        }
        
        updateSelectedSeatsDisplay();
        checkSeatSelectionValidity(1);
        
        // Resetear tickets al cambiar butacas
        Object.keys(ticketCounts).forEach(key => ticketCounts[key] = 0);
        updateTicketTotals();
    }

    function updateSelectedSeatsDisplay() {
        const displayList = selectedSeats.filter((v, i, a) => a.indexOf(v) === i).sort(); 
        selectedSeatsDisplay.textContent = displayList.join(', ') || 'Ninguna';
    }

    function checkSeatSelectionValidity(step) {
        const numSeats = selectedSeats.length;
        
        if (step === 1) {
            btnSiguienteButacas.disabled = numSeats === 0;
        } else if (step === 2) {
            const totalTickets = Object.values(ticketCounts).reduce((sum, count) => sum + count, 0);
            
            btnSiguienteEntradas.disabled = totalTickets !== numSeats;
            
            if (totalTickets === numSeats) {
                ticketValidationMsg.classList.remove('alert-warning');
                ticketValidationMsg.classList.add('alert-success');
                ticketValidationMsg.innerHTML = `¡Perfecto! El número de entradas (${numSeats}) coincide con el de butacas.`;
            } else {
                ticketValidationMsg.classList.remove('alert-success');
                ticketValidationMsg.classList.add('alert-warning');
                const remaining = numSeats - totalTickets;
                ticketValidationMsg.innerHTML = `Debe seleccionar un total de <span id="required-tickets">${numSeats}</span> entradas. Faltan **${remaining}** entradas.`;
            }
        }
    }
    
    function generateTicketList() {
        ticketListContainer.innerHTML = '';
        Object.keys(TICKET_PRICES).forEach(type => {
            const price = TICKET_PRICES[type];
            const name = type.replace('_', ' ');
            const count = ticketCounts[type];
            const totalTickets = Object.values(ticketCounts).reduce((sum, count) => sum + count, 0);
            const totalSeats = selectedSeats.length;
            
            const isMaxed = totalTickets >= totalSeats;

            const html = `
                <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <div class="flex-grow-1">
                        <span class="fw-bold text-uppercase">${name}</span>
                        <span class="text-muted"> S/${price.toFixed(2)}</span>
                    </div>
                    <div class="quantity-control me-4">
                        <button class="btn btn-sm btn-light decrease-ticket" data-type="${type}" ${count === 0 ? 'disabled' : ''}>-</button>
                        <span class="quantity-display" data-type="${type}">${count}</span>
                        <button class="btn btn-sm btn-light increase-ticket" data-type="${type}" ${isMaxed ? 'disabled' : ''}>+</button>
                    </div>
                    <div class="text-end" style="width: 80px;">
                        S/<span data-subtotal="${type}">${(count * price).toFixed(2)}</span>
                    </div>
                </div>
            `;
            ticketListContainer.insertAdjacentHTML('beforeend', html);
        });

        if (!ticketListContainer.hasEventListener) {
            ticketListContainer.addEventListener('click', handleTicketQuantityChange);
            ticketListContainer.hasEventListener = true;
        }

        updateTicketTotals();
    }

    function handleTicketQuantityChange(event) {
        const target = event.target;
        if (target.classList.contains('increase-ticket') || target.classList.contains('decrease-ticket')) {
            const type = target.getAttribute('data-type');
            const isIncrease = target.classList.contains('increase-ticket');
            const totalSeats = selectedSeats.length;
            const totalTickets = Object.values(ticketCounts).reduce((sum, count) => sum + count, 0);

            let newCount = ticketCounts[type] + (isIncrease ? 1 : -1);
            
            if (isIncrease && totalTickets < totalSeats) {
                ticketCounts[type] = newCount;
            } else if (!isIncrease && newCount >= 0) {
                ticketCounts[type] = newCount;
            }

            generateTicketList();
            updateTicketTotals();
        }
    }

    function updateTicketTotals() {
        let total = 0;
        Object.keys(ticketCounts).forEach(type => {
            const count = ticketCounts[type];
            const price = TICKET_PRICES[type];
            total += count * price;
        });
        
        totalEntradasDisplay.textContent = total.toFixed(2);
        checkSeatSelectionValidity(2); 
        updateGeneralTotal();
    }
    
    function generateSnackItems() {
    // Determinar la ruta base para las imágenes de snacks:
    // si la página actual está dentro de la carpeta /HTML/ (ej. HTML/Butacas.html),
    // las imágenes están una carpeta arriba: ../imagenes/
    const baseImgsPath = window.location.pathname.includes('/HTML/') ? '../imagenes/' : 'imagenes/';

        ['popcorn', 'bebidas'].forEach(category => {
            const container = document.getElementById(`${category}-items`);
            if (!container) return;
            container.innerHTML = '';
            SNACK_ITEMS[category].forEach(item => {
                if (snackCounts[item.id] === undefined) { snackCounts[item.id] = 0; }
                const count = snackCounts[item.id];

                // Usar la propiedad item.img (nombre de archivo) y construir la ruta completa
                const imgPath = `${baseImgsPath}${item.img}`;

                    const html = `
                        <div class="col">
                            <div class="product-card card h-100" data-price="${item.price.toFixed(2)}">
                                <img src="${imgPath}" class="card-img-top" alt="${item.name}" loading="lazy" width="200" height="140" style="object-fit: cover;" onerror="this.onerror=null;this.src='https://via.placeholder.com/200x140?text=Sin+imagen'">
                                <div class="card-body p-2">
                                    <p class="card-text text-center fw-bold">${item.name}</p>
                                    <div class="price text-center fw-bold">S/${item.price.toFixed(2)}</div>
                                    <div class="quantity-control d-flex justify-content-center mt-2" data-id="${item.id}">
                                        <button class="btn btn-sm btn-light decrease-snack" data-id="${item.id}" ${count === 0 ? 'disabled' : ''}>-</button>
                                        <span class="quantity px-2 quantity-display" data-id="${item.id}">${count}</span>
                                        <button class="btn btn-sm btn-light increase-snack" data-id="${item.id}">+</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                container.insertAdjacentHTML('beforeend', html);
            });
        });

        if (!document.getElementById('snacksTabContent').hasEventListener) {
            document.getElementById('snacksTabContent').addEventListener('click', handleSnackQuantityChange);
            document.getElementById('snacksTabContent').hasEventListener = true;
        }
        updateSnackTotals();
    }

    function handleSnackQuantityChange(event) {
        const target = event.target;
        if (target.classList.contains('increase-snack') || target.classList.contains('decrease-snack')) {
            const id = target.getAttribute('data-id');
            const isIncrease = target.classList.contains('increase-snack');
            
            let newCount = (snackCounts[id] || 0) + (isIncrease ? 1 : -1);
            
            if (newCount >= 0) {
                snackCounts[id] = newCount;
                generateSnackItems(); 
                updateSnackTotals();
            }
        }
    }

    function updateSnackTotals() {
        let total = 0;
        const allSnacks = [...SNACK_ITEMS.popcorn, ...SNACK_ITEMS.bebidas];
        
        allSnacks.forEach(item => {
            const count = snackCounts[item.id] || 0;
            total += count * item.price;
        });
        
        totalSnacksDisplay.textContent = total.toFixed(2);
        updateGeneralTotal();
    }

    function generateResumen() {
        resumenLista.innerHTML = '';
        let totalEntradas = 0;
        let totalSnacks = 0;

        // 1. Resumen de Entradas
        const numSeats = selectedSeats.length;
        if (numSeats > 0) {
            Object.keys(ticketCounts).forEach(type => {
                const count = ticketCounts[type];
                if (count > 0) {
                    const price = TICKET_PRICES[type];
                    const subtotal = count * price;
                    totalEntradas += subtotal;
                    
                    const li = document.createElement('li');
                    li.className = 'list-group-item d-flex justify-content-between';
                    li.innerHTML = `
                        <div>
                            ${count} x <span class="fw-bold text-uppercase">${type.replace('_', ' ')}</span>
                            <span class="text-muted"> (Asientos: ${selectedSeats.slice(0, count).join(', ')}${count < numSeats ? '...' : ''})</span>
                        </div>
                        <span>S/${subtotal.toFixed(2)}</span>
                    `;
                    resumenLista.appendChild(li);
                }
            });
        }
        
        // 2. Resumen de Snacks
        let haySnacks = false;
        Object.keys(snackCounts).forEach(id => {
            const count = snackCounts[id];
            if (count > 0) {
                haySnacks = true;
                const snack = getSnackById(id);
                const subtotal = count * snack.price;
                totalSnacks += subtotal;
                
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between';
                li.innerHTML = `
                    <div>
                        ${count} x <span class="fw-bold">${snack.name}</span>
                    </div>
                    <span>S/${subtotal.toFixed(2)}</span>
                `;
                resumenLista.appendChild(li);
            }
        });

        if (!haySnacks) {
             const li = document.createElement('li');
             li.className = 'list-group-item text-muted';
             li.textContent = 'No se seleccionaron snacks.';
             resumenLista.appendChild(li);
        }
        
        // 3. Total Final
        const totalFinal = totalEntradas + totalSnacks;
        const liTotal = document.createElement('li');
        liTotal.className = 'list-group-item d-flex justify-content-between bg-warning fw-bold';
        liTotal.innerHTML = `
            <span>Total Final:</span>
            <span>S/${totalFinal.toFixed(2)}</span>
        `;
        resumenLista.appendChild(liTotal);

        totalGeneralDisplay.textContent = totalFinal.toFixed(2);
    }

    function updateGeneralTotal() {
        const totalEntradas = parseFloat(totalEntradasDisplay.textContent) || 0;
        const totalSnacks = parseFloat(totalSnacksDisplay.textContent) || 0;
        const totalGeneral = totalEntradas + totalSnacks;
        totalGeneralDisplay.textContent = totalGeneral.toFixed(2);
    }

    function showStep(step) {
        if (step < 1 || step > 4) return;
        
        stepContents.forEach(content => content.classList.add('d-none'));
        stepButtons.forEach(btn => btn.classList.remove('btn-primary', 'btn-outline-secondary'));

        const contentToShow = document.querySelector(`.step-content[data-step="${step}"]`);
        if (contentToShow) contentToShow.classList.remove('d-none');

        const currentStepBtn = document.querySelector(`#step-bar button[data-step="${step}"]`);
        if (currentStepBtn) {
            currentStepBtn.classList.add('btn-primary');
            currentStepBtn.classList.remove('btn-outline-secondary');
        }

        for (let i = 1; i < step; i++) {
            const prevBtn = document.querySelector(`#step-bar button[data-step="${i}"]`);
             if (prevBtn) {
                prevBtn.classList.add('btn-outline-secondary');
                prevBtn.classList.remove('btn-primary');
             }
        }
        
        currentStep = step;
        
        if (step === 1) {
            checkSeatSelectionValidity(1);
        } else if (step === 2) {
            generateTicketList();
        } else if (step === 3) {
            generateSnackItems();
        } else if (step === 4) {
            generateResumen();
        }
    }

    // Manejar clics en el botón "Siguiente >"
    document.querySelectorAll('.btn-siguiente').forEach(button => {
        button.addEventListener('click', (e) => {
            const nextStep = parseInt(e.currentTarget.getAttribute('data-next-step'));
            if (nextStep) {
                showStep(nextStep);
            }
        });
    });

    // Manejar clic en el botón "< Atrás"
     btnAtras.addEventListener('click', () => {
        const prevStep = currentStep - 1;
        if (prevStep >= 1) {
            showStep(prevStep);
        }
    });

    // --- LÓGICA: MOSTRAR MODAL DE PAGO (FORMULARIO) ---
    btnIniciarPago.addEventListener('click', () => {
        const totalGeneral = totalGeneralDisplay.textContent;
        
        // 1. Guardar en localStorage el carrito de butacas (entradas + snacks) para que Pago pueda leerlo si es necesario
        try {
            const items = [];
            // Tickets
            Object.keys(ticketCounts).forEach(type => {
                const qty = ticketCounts[type] || 0;
                if (qty > 0) {
                    const price = TICKET_PRICES[type] || 0;
                    items.push({ name: type.replace('_', ' '), price: price, qty: qty, subtotal: +(price * qty).toFixed(2) });
                }
            });
            // Snacks
            Object.keys(snackCounts).forEach(id => {
                const qty = snackCounts[id] || 0;
                if (qty > 0) {
                    const snack = getSnackById(id);
                    if (snack) items.push({ name: snack.name, price: snack.price, qty: qty, subtotal: +(snack.price * qty).toFixed(2) });
                }
            });

            const totalVal = parseFloat((parseFloat(totalGeneralDisplay.textContent) || 0).toFixed(2));
            localStorage.setItem('butacasCart', JSON.stringify(items));
            localStorage.setItem('butacasTotal', totalVal.toFixed(2));
        } catch (ex) {
            console.warn('No se pudo guardar butacas cart en localStorage', ex);
        }

        // 2. Actualizar el monto dentro del modal
        modalTotalPagoDisplay.textContent = totalGeneral;

        // 3. Mostrar el modal (que ahora contiene el formulario de datos y tarjeta)
        paymentModal.show();
    });

    // --- Manejar confirmación de pago dentro del modal de Butacas: validación y toasts ---
    const confirmButacasBtn = document.getElementById('confirm-pay-btn-butacas');
    if (confirmButacasBtn) {
        confirmButacasBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const docTypeEl = document.getElementById('doc-type-butacas');
            const docNumberEl = document.getElementById('doc-number-butacas');
            const firstNameEl = document.getElementById('first-name-butacas');
            const lastNameEl = document.getElementById('last-name-butacas');
            const emailEl = document.getElementById('email-butacas');
            const termsEl = document.getElementById('termsSwitch');

            const cardNumberEl = document.getElementById('card-number-butacas');
            const cardExpEl = document.getElementById('card-exp-butacas');
            const cardCvvEl = document.getElementById('card-cvv-butacas');
            const cardNameEl = document.getElementById('card-name-butacas');
            const yapePhoneEl = document.getElementById('yape-phone-butacas');

            const missing = [];
            const invalidEls = [];

            if (!docTypeEl || !docTypeEl.value) { missing.push('Tipo de documento'); if (docTypeEl) invalidEls.push(docTypeEl); }
            if (!docNumberEl || !docNumberEl.value.trim()) { missing.push('Número de documento'); if (docNumberEl) invalidEls.push(docNumberEl); }
            if (!firstNameEl || !firstNameEl.value.trim()) { missing.push('Nombre'); if (firstNameEl) invalidEls.push(firstNameEl); }
            if (!lastNameEl || !lastNameEl.value.trim()) { missing.push('Apellido'); if (lastNameEl) invalidEls.push(lastNameEl); }
            if (!emailEl || !/\S+@\S+\.\S+/.test(emailEl.value.trim())) { missing.push('Correo electrónico válido'); if (emailEl) invalidEls.push(emailEl); }
            if (!termsEl || !termsEl.checked) { missing.push('Aceptar Términos y Condiciones'); if (termsEl) invalidEls.push(termsEl); }

            const selectedMethod = (document.querySelector('input[name="paymentOption"]:checked') || {}).id || null;
            if (selectedMethod === 'cardPayment') {
                if (!cardNumberEl || !/^[0-9\s-]{12,19}$/.test(cardNumberEl.value.trim())) { missing.push('Número de tarjeta válido'); if (cardNumberEl) invalidEls.push(cardNumberEl); }
                if (!cardExpEl || !/^(0[1-9]|1[0-2])\/?([0-9]{2}|[0-9]{4})$/.test(cardExpEl.value.trim())) { missing.push('Vencimiento MM/AA'); if (cardExpEl) invalidEls.push(cardExpEl); }
                if (!cardCvvEl || !/^[0-9]{3,4}$/.test(cardCvvEl.value.trim())) { missing.push('CVV'); if (cardCvvEl) invalidEls.push(cardCvvEl); }
                if (!cardNameEl || !cardNameEl.value.trim()) { missing.push('Nombre en tarjeta'); if (cardNameEl) invalidEls.push(cardNameEl); }
            } else if (selectedMethod === 'yapePayment') {
                if (!yapePhoneEl || !/^[0-9]{6,15}$/.test(yapePhoneEl.value.trim())) { missing.push('Teléfono Yape válido'); if (yapePhoneEl) invalidEls.push(yapePhoneEl); }
            } else {
                missing.push('Seleccionar método de pago');
            }

            const totalVal = parseFloat(totalGeneralDisplay.textContent) || 0;
            if (totalVal <= 0) { missing.push('Productos o entradas seleccionadas (total > S/0.00)'); }

            // limpiar marcas previas
            document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

            if (missing.length > 0) {
                if (invalidEls.length > 0) {
                    invalidEls.forEach(el => el.classList.add('is-invalid'));
                    const firstFocusable = invalidEls.find(el => typeof el.focus === 'function');
                    if (firstFocusable) firstFocusable.focus();
                }
                invalidEls.forEach(el => {
                    const handler = () => { el.classList.remove('is-invalid'); el.removeEventListener('input', handler); el.removeEventListener('change', handler); };
                    el.addEventListener('input', handler);
                    el.addEventListener('change', handler);
                });

                const errBody = document.getElementById('errorToastBodyButacas');
                if (errBody) errBody.innerHTML = `Complete: <strong>${missing.join('</strong>, <strong>')}</strong>`;
                try {
                    const toastEl = document.getElementById('errorToastButacas');
                    if (toastEl && typeof bootstrap !== 'undefined') {
                        const t = new bootstrap.Toast(toastEl, { delay: 5000 });
                        t.show();
                    } else {
                        alert('Faltan: ' + missing.join(', '));
                    }
                } catch (ex) {
                    alert('Faltan: ' + missing.join(', '));
                }
                return;
            }

            // Si pasa validación, mostrar toast de éxito con número de pedido
            try {
                const orderId = 'CB' + Date.now().toString().slice(-8) + Math.floor(Math.random()*900+100).toString();
                const orderEl = document.getElementById('order-id-butacas');
                if (orderEl) orderEl.textContent = orderId;
                const toastEl = document.getElementById('successToastButacas');
                if (toastEl && typeof bootstrap !== 'undefined') {
                    const t = new bootstrap.Toast(toastEl, { delay: 3000 });
                    t.show();
                } else {
                    alert('Compra con éxito. Pedido: ' + orderId);
                }
            } catch (ex) {
                console.log('Compra con éxito');
            }

            try {
                localStorage.removeItem('butacasCart');
                localStorage.removeItem('butacasTotal');
                localStorage.removeItem('chocloCart');
                localStorage.removeItem('chocloTotal');
            } catch (ex) { console.warn(ex); }

            // Actualizar UI: total a 0 y limpiar resumen
            totalGeneralDisplay.textContent = '0.00';
            modalTotalPagoDisplay.textContent = '0.00';
            resumenLista.innerHTML = '';
            paymentModal.hide();
        });
    }

    // --- Inicialización ---
    
    // 1. Mostrar la hora y fecha de ingreso del usuario
    displayEntryTime(); 

    // 2. Inicializar la lógica principal de la compra
    generateSeatMap();
    checkSeatSelectionValidity(1); 
    showStep(1);
    
    // 3. Inicialización del TEMPORIZADOR DE SESIÓN (Barra superior)
    updateClock(); 
    timerInterval = setInterval(updateClock, 1000); 
});
(function(){
    const params = new URLSearchParams(window.location.search);
    let title = params.get('title');
    let image = params.get('image');
    let time = params.get('time');
    let date = params.get('date');
    let location = params.get('location');

    // If any important param is missing, try to read from localStorage:selectedShow
    if ((!title || !time) && window.localStorage) {
        try {
            const raw = localStorage.getItem('selectedShow');
            if (raw) {
                const sel = JSON.parse(raw);
                title = title || sel.title;
                image = image || sel.image;
                time = time || sel.time;
                date = date || sel.date;
                location = location || sel.location;
            }
        } catch (ex) {
            console.warn('No se pudo leer selectedShow desde localStorage', ex);
        }
    }

    if (title) {
        const decodedTitle = decodeURIComponent(title);
        const tEl = document.getElementById('movie-title');
        if (tEl) tEl.textContent = decodedTitle;
        
        // Mostrar duración si está disponible
        const durationEl = document.getElementById('movie-duration');
        if (durationEl && window.MOVIE_DURATIONS && window.MOVIE_DURATIONS[decodedTitle]) {
            const minutes = window.MOVIE_DURATIONS[decodedTitle];
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            durationEl.textContent = `${hours}h ${remainingMinutes}min`;
        }
    }

    if (image) {
        const imgEl = document.getElementById('movie-poster');
        if (imgEl) imgEl.setAttribute('src', decodeURIComponent(image));
    }

    if (time) {
        const timeEl = document.getElementById('movie-time') || document.getElementById('movie-time-display');
        if (timeEl) timeEl.textContent = `🕒 ${decodeURIComponent(time)}`;
    }

    if (date) {
        // Formatear la fecha ISO a un formato legible y mostrar 'Hoy' cuando corresponda
        try {
            const dObj = new Date(date);
            const fullDateStr = dObj.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const todayIso = new Date().toISOString().split('T')[0];
            const label = (date === todayIso) ? `Hoy — ${fullDateStr}` : `${fullDateStr.charAt(0).toUpperCase() + fullDateStr.slice(1)}`;
            const dateEl = document.getElementById('movie-date') || document.getElementById('current-entry-date');
            if (dateEl) {
                // Mostrar la etiqueta 'Hoy — <fecha completa>' cuando corresponda, pero
                // NO agregar atributo title para evitar que aparezca cuadro de texto al pasar el cursor.
                dateEl.textContent = `📅 ${label}`;
            }
        } catch (ex) {
            const dateEl = document.getElementById('movie-date') || document.getElementById('current-entry-date');
            if (dateEl) dateEl.textContent = `📅 ${decodeURIComponent(date)}`;
        }
    }

    if (location) {
        // movie-cine exists in the template
        const locEl = document.getElementById('movie-location') || document.getElementById('movie-cine');
        if (locEl) locEl.textContent = decodeURIComponent(location);
    }

    // Also set entry time display if available
    if (time) {
        const entryTimeEl = document.getElementById('current-entry-time') || document.getElementById('movie-time') || document.getElementById('movie-time-display');
        if (entryTimeEl) entryTimeEl.textContent = `🕒 ${decodeURIComponent(time)}`;
    }
})();