document.addEventListener('DOMContentLoaded', () => {
    const dateBoxes = document.querySelectorAll('.date-box');

    dateBoxes.forEach(box => {
        box.addEventListener('click', () => {
            // 1. Remove 'active' class from all date boxes
            dateBoxes.forEach(b => b.classList.remove('active'));

            // 2. Add 'active' class to the clicked date box
            box.classList.add('active');

            // NOTE: In a real application, you would also use the 'data-date'
            // attribute (e.g., box.dataset.date) to fetch and display the
            // showtimes for the newly selected date via an API call.
            console.log('Date selected:', box.dataset.date);
        });
    });

    // Add interactivity to showtime buttons (optional hover effect)
    const timeButtons = document.querySelectorAll('.time-button');
    timeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Prevent navigating away from the 'Comprar' link if clicked
            if (e.target.closest('.buy-link')) {
                return;
            }
            
            // Log the selected showtime and location
            const location = button.closest('.location-group').dataset.location;
            const time = button.dataset.time;
            console.log(`Selected showtime: ${time} at ${location}`);
            
            // Example of highlighting a selected button temporarily
            button.style.backgroundColor = '#ffd6d6';
            setTimeout(() => {
                button.style.backgroundColor = ''; // Revert style
            }, 500);
        });
    });
});
(function(){
            const params = new URLSearchParams(window.location.search);
            const title = params.get('title') ? decodeURIComponent(params.get('title')) : 'Película';
            const image = params.get('image') ? decodeURIComponent(params.get('image')) : '../imagenes/placeholder.png';

            document.getElementById('movie-title')?.textContent = title;
            document.getElementById('movie-poster')?.setAttribute('src', image);
            document.getElementById('movie-desc')?.textContent = 'Seleccione una función y presione "Comprar" para continuar con la selección de butacas.';
            document.getElementById('movie-meta')?.textContent = '';

            document.querySelectorAll('.times-container .time-button').forEach(btn => {
                const time = btn.getAttribute('data-time') || '';
                const buyLink = btn.querySelector('.buy-link');
                if(buyLink) {
                    buyLink.href = `Butacas.html?title=${encodeURIComponent(title)}&image=${encodeURIComponent(image)}&time=${encodeURIComponent(time)}`;
                }
            });
        })();