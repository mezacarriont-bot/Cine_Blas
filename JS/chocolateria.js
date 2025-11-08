(function(){
            const btnSiguiente = document.getElementById('btn-siguiente-pago');
            
            const updateSiguienteState = () => {
                const hasPositiveQuantity = [...document.querySelectorAll('.quantity')]
                    .some(span => Number(span.textContent) > 0);
                
                btnSiguiente.classList.toggle('disabled', !hasPositiveQuantity);
                btnSiguiente.setAttribute('aria-disabled', !hasPositiveQuantity);
            };

            document.querySelectorAll('.product-card').forEach(card => {
                const decrease = card.querySelector('.decrease');
                const increase = card.querySelector('.increase');
                const qtyEl = card.querySelector('.quantity');

                increase?.addEventListener('click', () => {
                    qtyEl.textContent = String(Number(qtyEl.textContent) + 1);
                    updateSiguienteState();
                });

                decrease?.addEventListener('click', () => {
                    qtyEl.textContent = String(Math.max(0, Number(qtyEl.textContent) - 1));
                    updateSiguienteState();
                });
            });

            // Al hacer clic en "Siguiente" guardamos el carrito en localStorage para que Pago.html lo lea
            btnSiguiente.addEventListener('click', (e) => {
                // Recolectar productos con cantidad > 0
                const items = [];
                document.querySelectorAll('.product-card').forEach(card => {
                    const qty = Number(card.querySelector('.quantity')?.textContent || 0);
                    if (qty > 0) {
                        const price = parseFloat(card.getAttribute('data-price')) || 0;
                        const name = card.querySelector('.card-text')?.textContent?.trim() || 'Producto';
                        items.push({ name, price, qty, subtotal: +(price * qty).toFixed(2) });
                    }
                });

                const total = items.reduce((s, it) => s + it.subtotal, 0);

                try {
                    localStorage.setItem('chocloCart', JSON.stringify(items));
                    localStorage.setItem('chocloTotal', total.toFixed(2));
                } catch (ex) {
                    // Si falla (por ejemplo en modo privado), seguimos sin bloquear la navegación
                    console.warn('No se pudo guardar el carrito en localStorage', ex);
                }

                // la navegación continúa por el enlace normal (href)
            });

            updateSiguienteState();
        })();