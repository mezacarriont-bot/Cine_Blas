document.addEventListener('DOMContentLoaded', () => {
    // Recuperar el total del carrito guardado en el archivo principal (index.html)
    const finalTotalSpan = document.getElementById('final-total');
    // Primero intentar leer un carrito completo (chocloCart). Si no existe, leer el valor simple 'chocloTotal' por compatibilidad.
    const savedCartJson = localStorage.getItem('chocloCart');
    const savedTotal = localStorage.getItem('chocloTotal');

    let computedTotal = 0;
    if (savedCartJson) {
        try {
            const items = JSON.parse(savedCartJson);
            if (Array.isArray(items)) {
                computedTotal = items.reduce((s, it) => s + (parseFloat(it.subtotal) || (parseFloat(it.price || 0) * (parseInt(it.qty || 0) || 0))), 0);
                // Mostrar un resumen pequeño arriba del formulario de pago
                const paymentContainer = document.querySelector('.payment-container');
                if (paymentContainer) {
                    const summary = document.createElement('div');
                    summary.className = 'mb-3 bg-light p-2 rounded';
                    const lines = items.map(it => `<div class="d-flex justify-content-between"><div>${it.qty} x ${it.name}</div><div>S/${(it.subtotal|| (it.price*it.qty)).toFixed(2)}</div></div>`).join('');
                    summary.innerHTML = `<div class="fw-bold mb-2">Resumen de Productos:</div>${lines}`;
                    paymentContainer.insertAdjacentElement('afterbegin', summary);
                }
            }
        } catch (ex) {
            console.warn('Error leyendo chocloCart:', ex);
        }
    } else if (savedTotal) {
        computedTotal = parseFloat(savedTotal) || 0;
    }

    if (computedTotal > 0) {
        finalTotalSpan.textContent = `S/${computedTotal.toFixed(2)}`;
    }

    // Elementos de Pago
    const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
    const paymentCardDetails = document.getElementById('payment-card-details');
    const paymentYapeDetails = document.getElementById('payment-yape-details');

    // Alternar entre Pago con Tarjeta y Yape
    paymentMethods.forEach(radio => {
        radio.addEventListener('change', (event) => {
            document.querySelectorAll('.payment-details').forEach(detail => detail.classList.remove('active'));

            if (event.target.value === 'card') {
                paymentCardDetails.classList.add('active');
            } else if (event.target.value === 'yape') {
                paymentYapeDetails.classList.add('active');
            }
        });
    });

    // Alternar entre Boleta y Factura
    document.getElementById('btn-boleta').addEventListener('click', () => {
        document.getElementById('btn-boleta').classList.add('active');
        document.getElementById('btn-factura').classList.remove('active');
    });

    document.getElementById('btn-factura').addEventListener('click', () => {
        document.getElementById('btn-factura').classList.add('active');
        document.getElementById('btn-boleta').classList.remove('active');
    });

    // Helper: generar ID de pedido
    function generateOrderId(prefix = 'CB') {
        const ts = Date.now().toString();
        const rnd = Math.floor(Math.random() * 900 + 100).toString();
        return `${prefix}${ts.slice(-8)}${rnd}`;
    }

    // Helper: Luhn check para tarjetas
    function luhnCheck(cardNumber) {
        if (!cardNumber) return false;
        const s = cardNumber.replace(/\D/g, '');
        let sum = 0;
        let shouldDouble = false;
        for (let i = s.length - 1; i >= 0; i--) {
            let digit = parseInt(s.charAt(i), 10);
            if (shouldDouble) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
            shouldDouble = !shouldDouble;
        }
        return (sum % 10) === 0;
    }

    // Manejar clic en el botón de confirmar pago (mostrar aviso y limpiar carrito)
    const confirmPayBtn = document.getElementById('confirm-pay-btn');
    if (confirmPayBtn) {
        confirmPayBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Recolectar valores de campos requeridos (elementos)
            const docTypeEl = document.getElementById('doc-type');
            const docNumberEl = document.getElementById('doc-number');
            const firstNameEl = document.getElementById('first-name');
            const lastNameEl = document.getElementById('last-name');
            const emailEl = document.getElementById('email');
            const termsEl = document.getElementById('terms-accepted');

            const cardNumberEl = document.getElementById('card-number');
            const cardExpEl = document.getElementById('card-exp');
            const cardCvvEl = document.getElementById('card-cvv');
            const cardNameEl = document.getElementById('card-name');
            const yapePhoneEl = document.getElementById('yape-phone');

            const missing = [];
            const invalidEls = [];

            // Validaciones básicas y registro de elementos inválidos
            if (!docTypeEl || !docTypeEl.value) { missing.push('Tipo de documento'); if (docTypeEl) invalidEls.push(docTypeEl); }
            if (!docNumberEl || !docNumberEl.value.trim()) { missing.push('Número de documento'); if (docNumberEl) invalidEls.push(docNumberEl); }
            if (!firstNameEl || !firstNameEl.value.trim()) { missing.push('Nombre'); if (firstNameEl) invalidEls.push(firstNameEl); }
            if (!lastNameEl || !lastNameEl.value.trim()) { missing.push('Apellido'); if (lastNameEl) invalidEls.push(lastNameEl); }
            if (!emailEl || !/\S+@\S+\.\S+/.test(emailEl.value.trim())) { missing.push('Correo electrónico válido'); if (emailEl) invalidEls.push(emailEl); }
            if (!termsEl || !termsEl.checked) { missing.push('Aceptar Términos y Condiciones'); if (termsEl) invalidEls.push(termsEl); }

            // Verificar método de pago seleccionado
            const selectedMethod = (document.querySelector('input[name="payment-method"]:checked') || {}).value || null;
            if (selectedMethod === 'card') {
                if (!cardNumberEl || !/^[0-9\s-]{12,19}$/.test(cardNumberEl.value.trim())) { missing.push('Número de tarjeta válido'); if (cardNumberEl) invalidEls.push(cardNumberEl); }
                if (!cardExpEl || !/^(0[1-9]|1[0-2])\/?([0-9]{2}|[0-9]{4})$/.test(cardExpEl.value.trim())) { missing.push('Vencimiento MM/AA'); if (cardExpEl) invalidEls.push(cardExpEl); }
                if (!cardCvvEl || !/^[0-9]{3,4}$/.test(cardCvvEl.value.trim())) { missing.push('CVV'); if (cardCvvEl) invalidEls.push(cardCvvEl); }
                if (!cardNameEl || !cardNameEl.value.trim()) { missing.push('Nombre en tarjeta'); if (cardNameEl) invalidEls.push(cardNameEl); }
            } else if (selectedMethod === 'yape') {
                if (!yapePhoneEl || !/^[0-9]{6,15}$/.test(yapePhoneEl.value.trim())) { missing.push('Teléfono Yape válido'); if (yapePhoneEl) invalidEls.push(yapePhoneEl); }
            } else {
                // Si no hay método seleccionado, pedir selección
                missing.push('Seleccionar método de pago');
            }

            // Verificar que exista un total mayor a cero
            const finalTotalText = finalTotalSpan ? finalTotalSpan.textContent.replace(/[^0-9.,]/g, '').replace(',', '.') : '0';
            const finalTotalValue = parseFloat(finalTotalText) || 0;
            if (finalTotalValue <= 0) { missing.push('Productos o entradas seleccionadas (total > S/0.00)'); }

            // Limpiar marcas previas
            document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

            if (missing.length > 0) {
                // Marcar elementos inválidos visualmente y asignar mensajes específicos
                if (invalidEls.length > 0) {
                    invalidEls.forEach(el => {
                        el.classList.add('is-invalid');
                        const feedback = el.nextElementSibling;
                        if (feedback && feedback.classList && feedback.classList.contains('invalid-feedback')) {
                            // Mensaje por campo
                            switch (el.id) {
                                case 'doc-type': feedback.textContent = 'Seleccione un tipo de documento.'; break;
                                case 'doc-number': feedback.textContent = 'Ingrese su número de documento.'; break;
                                case 'first-name': feedback.textContent = 'Ingrese su nombre.'; break;
                                case 'last-name': feedback.textContent = 'Ingrese su apellido.'; break;
                                case 'email': feedback.textContent = 'Ingrese un correo electrónico válido.'; break;
                                case 'card-number': feedback.textContent = 'Número de tarjeta inválido.'; break;
                                case 'card-exp': feedback.textContent = 'Formato MM/AA o MM/YYYY.'; break;
                                case 'card-cvv': feedback.textContent = 'Ingrese el CVV (3 o 4 dígitos).'; break;
                                case 'card-name': feedback.textContent = 'Ingrese el nombre en la tarjeta.'; break;
                                case 'yape-phone': feedback.textContent = 'Ingrese un teléfono Yape válido.'; break;
                                default: feedback.textContent = 'Complete este campo.'; break;
                            }
                        }
                    });
                    const firstFocusable = invalidEls.find(el => typeof el.focus === 'function');
                    if (firstFocusable) firstFocusable.focus();
                }

                // Añadir listeners para limpiar la clase is-invalid cuando el usuario corrija
                invalidEls.forEach(el => {
                    const handler = () => { el.classList.remove('is-invalid'); el.removeEventListener('input', handler); el.removeEventListener('change', handler); };
                    el.addEventListener('input', handler);
                    el.addEventListener('change', handler);
                });

                // Mostrar toast de error con lista de faltantes
                const errorBody = document.getElementById('errorToastBody');
                if (errorBody) {
                    errorBody.innerHTML = `Complete: <strong>${missing.join('</strong>, <strong>')}</strong>`;
                }
                try {
                    const toastEl = document.getElementById('errorToast');
                    if (toastEl && typeof bootstrap !== 'undefined') {
                        const toast = new bootstrap.Toast(toastEl, { delay: 5000 });
                        toast.show();
                    } else {
                        alert('Faltan: ' + missing.join(', '));
                    }
                } catch (ex) {
                    alert('Faltan: ' + missing.join(', '));
                }

                return; // detener flujo de pago
            }

            // Si pasó validación, proceder con la compra
            // Intentar cerrar modal si existe
            const modalEl = document.getElementById('paymentModal');
            try {
                if (modalEl) {
                    const instance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                    instance.hide();
                }
            } catch (ex) {
                // Ignorar
            }

            // Mostrar toast de éxito con número de pedido
            try {
                const orderId = generateOrderId();
                const orderEl = document.getElementById('order-id');
                if (orderEl) orderEl.textContent = orderId;

                const toastEl = document.getElementById('successToast');
                if (toastEl && typeof bootstrap !== 'undefined') {
                    const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
                    toast.show();
                } else {
                    alert('Compra con éxito. Pedido: ' + orderId);
                }
            } catch (ex) {
                console.log('Compra con éxito');
            }

            // Limpiar claves relacionadas del carrito
            try {
                localStorage.removeItem('chocloCart');
                localStorage.removeItem('chocloTotal');
                localStorage.removeItem('butacasCart');
                localStorage.removeItem('butacasTotal');
            } catch (ex) {
                console.warn('No se pudo limpiar localStorage', ex);
            }

            // Actualizar UI: poner total a 0 y eliminar resumen
            if (finalTotalSpan) finalTotalSpan.textContent = 'S/0.00';
            const paymentContainer = document.querySelector('.payment-container');
            if (paymentContainer) {
                const summary = paymentContainer.querySelector('.mb-3.bg-light');
                if (summary) summary.remove();
            }
        });
    }
});