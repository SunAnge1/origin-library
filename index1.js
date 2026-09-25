document.addEventListener('DOMContentLoaded', function() {

    const searchInput = document.querySelector('.status input');
    const hamburger = document.querySelector('.hamburger');

    hamburger.addEventListener('click', function() {
        document.querySelector('.dashboard').classList.toggle('fullView');
    });

    fetch('http://127.0.0.1:5000/cards')
        .then(response => response.json())
        .then(games => {
            const gamesList = document.querySelector('.games-list');

            games.forEach(game => {
                const card = document.createElement('div');
                card.classList.add('cards');

                card.innerHTML = `
                    <img src="${game.image}" alt="">
                    <div class="card-info">
                        <h2>${game.name}</h2>
                        <p>${game.platform}</p>
                        <div class="progress" data-progress="${game.progress}"></div>
                    </div>
                    <div class="percentage">${game.progress}%</div>
                `;

                gamesList.appendChild(card);
            });

            document.querySelectorAll('.progress').forEach(bar => {
                bar.style.width = bar.dataset.progress + '%';
            });

            const cards = document.querySelectorAll('.cards');

            searchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();

                cards.forEach(card => {
                    const gameName = card.querySelector('h2').textContent.toLowerCase();
                    if (gameName.includes(searchTerm)) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
});