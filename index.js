document.addEventListener('DOMContentLoaded', function() {
    const progressBars = document.querySelectorAll('.progress');
    const notifIcon = document.getElementById('notifIcon');
    const notifDropdown = document.getElementById('notifDropdown');
    const notifBadge = document.getElementById('notifBadge');
    const notifList = document.getElementById('notifList');
    const emptyNotif = document.getElementById('emptyNotif');
    const clearAllNotifs = document.getElementById('clearAllNotifs');
    
    // Cart DOM Elements
    const cartIcon = document.getElementById('cartIcon'); // Added missing declaration
    const cartDropdown = document.getElementById('cartDropdown');
    const cartBadge = document.getElementById('cartBadge');
    const cartList = document.getElementById('cartList');
    const emptyList = document.getElementById('emptyList');
    const clearList = document.getElementById('clearList');
    
    // Others
    const addGameForm = document.getElementById('addGameForm');
    const addGameButton = document.getElementById('addGameBtn');
    const backdrop = document.getElementById('backdrop');
    const hamburger = document.querySelector('.hamburger');

    // Sidebar Toggle
    hamburger.addEventListener('click', function() {
        document.querySelector('.dashboard').classList.toggle('fullView');
    });

    // Hidden Form Handlers
    addGameButton.addEventListener('click', function() {
        addGameForm.classList.toggle('hidden');
        backdrop.classList.toggle('hidden');
    });

    backdrop.addEventListener('click', function() {
        addGameForm.classList.add('hidden');
        backdrop.classList.add('hidden');
    });

    // Add Game Form Submission
    addGameForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const gameName = document.getElementById('gameName').value;
        const platform = document.getElementById('platform').value;
        const gameMessage = document.getElementById('gameMessage');

        if (!gameName.trim()) {
            gameMessage.textContent = 'Please enter a valid name';
            gameMessage.style.display = 'block';
            gameMessage.style.color = '#ff4d4d';
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:5000/games`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: gameName, platform: platform })
            });

            const data = await response.json();

            if (response.ok) {
                addGameForm.classList.add('hidden');
                backdrop.classList.add('hidden');
                document.getElementById('gameName').value = '';
                document.getElementById('platform').value = '';
                
                loadGames();
                loadNotifications();

                // Trigger pulse animation on badge
                notifBadge.classList.remove('pulse');
                void notifBadge.offsetWidth;
                notifBadge.classList.add('pulse');
            } else {
                gameMessage.style.color = '#ff4d4d';
                gameMessage.textContent = data.message || 'Something went wrong, please try again later';
                gameMessage.style.display = 'block';
            }
        } catch (error) {
            gameMessage.style.color = '#ff4d4d';
            gameMessage.textContent = 'Server error. Is Flask running?';
            gameMessage.style.display = 'block';
        }
    });

    // Toggle Notification Dropdown
    notifIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        cartDropdown.classList.add('hidden'); // Close cart if open
        notifDropdown.classList.toggle('hidden');
    });

    // Toggle Cart Dropdown
    if (cartIcon) {
        cartIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            notifDropdown.classList.add('hidden'); // Close notifs if open
            cartDropdown.classList.toggle('hidden');
        });
    }

    // Close Dropdowns On Outside Click
    document.addEventListener('click', (e) => {
        if (!notifDropdown.contains(e.target) && !notifIcon.contains(e.target)) {
            notifDropdown.classList.add('hidden');
        }
        if (cartDropdown && cartIcon && !cartDropdown.contains(e.target) && !cartIcon.contains(e.target)) {
            cartDropdown.classList.add('hidden');
        }
    });

    // Prevent Dropdowns from Closing on Self-Click
    notifDropdown.addEventListener('click', (e) => e.stopPropagation());
    if (cartDropdown) {
        cartDropdown.addEventListener('click', (e) => e.stopPropagation());
    }

    // Fetch Notifications
    function loadNotifications() {
        fetch('http://127.0.0.1:5000/notifications', { credentials: 'include' })
            .then(res => res.ok ? res.json() : null)
            .then(notifications => {
                if (!notifications) return;

                notifList.innerHTML = '';

                if (notifications.length === 0) {
                    notifList.classList.add('hidden');
                    emptyNotif.classList.remove('hidden');
                    notifBadge.classList.add('hidden');
                } else {
                    notifList.classList.remove('hidden');
                    emptyNotif.classList.add('hidden');
                    notifBadge.textContent = notifications.length;
                    notifBadge.classList.remove('hidden');

                    notifications.forEach(notif => {
                        const li = document.createElement('li');
                        li.className = 'notif-item';
                        li.innerHTML = `
                            <span>${notif.message}</span>
                            <button data-id="${notif.id}">&times;</button>
                        `;
                        notifList.appendChild(li);
                    });
                }
            });
    }

    // Delete Single Notification
    notifList.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const notifId = e.target.dataset.id;
            fetch(`http://127.0.0.1:5000/notifications/${notifId}`, {
                method: 'DELETE',
                credentials: 'include'
            }).then(res => {
                if (res.ok) loadNotifications();
            });
        }
    });

    // Clear All Notifications
    clearAllNotifs.addEventListener('click', () => {
        fetch('http://127.0.0.1:5000/notifications', {
            method: 'DELETE',
            credentials: 'include'
        }).then(res => {
            if (res.ok) loadNotifications();
        });
    });

    // Fetch Cart
    async function loadCart() {
        try {
            const response = await fetch('http://127.0.0.1:5000/cart', { credentials: 'include' });
            if (!response.ok) return;

            const items = await response.json();

            if (cartBadge) {
                cartBadge.textContent = items.length;
                cartBadge.classList.toggle('hidden', items.length === 0);
            }

            if (items.length === 0) {
                if (emptyList) emptyList.classList.remove('hidden');
                if (cartList) cartList.innerHTML = '';
            } else {
                if (emptyList) emptyList.classList.add('hidden');
                if (cartList) {
                    cartList.innerHTML = items.map(item => `
                        <li>
                            <span>${item.name}</span>
                            <button class="cart-delete-btn" data-id="${item.id}">&times;</button>
                        </li>
                    `).join('');
                }
            }
        } catch (err) {
            console.error("Failed to fetch cart items:", err);
        }
    }

    // Single Cart Item Delete (Event Delegation)
    if (cartList) {
        cartList.addEventListener('click', (e) => {
            if (e.target.classList.contains('cart-delete-btn')) {
                const itemId = e.target.dataset.id;
                fetch(`http://127.0.0.1:5000/cart/${itemId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                }).then(res => {
                    if (res.ok) loadCart();
                });
            }
        });
    }

    // Clear All Cart Items
    if (clearList) {
        clearList.addEventListener('click', () => {
            fetch('http://127.0.0.1:5000/cart', {
                method: 'DELETE',
                credentials: 'include'
            }).then(res => {
                if (res.ok) loadCart();
            });
        });
    }

    

    // Fetch Games
    function loadGames() {
        fetch('http://127.0.0.1:5000/games', { credentials: 'include' })
            .then(response => {
                if (!response.ok) {
                    window.location.href = 'loginpage.html';
                    return;
                }
                return response.json();
            })
            .then(games => {
                if (!games) return;

                const gamesList = document.querySelector('.games-list');
                gamesList.innerHTML = '';

                if (games.length === 0) {
                    gamesList.innerHTML = '<p class="emptyList" style="text-align:center;opacity:0.5;padding:2rem;">No games added — click search icon to get started </p>';
                }

                games.forEach(game => {
                    const card = document.createElement('div');
                    card.classList.add('cards');
                    const imageSrc = game.cover_image || 'images/placeholder.png';

                    card.innerHTML = `
                        <img src="${imageSrc}" alt="">
                        <div class="card-info">
                            <h2 class="game-title">${game.name}</h2>
                            <p class="game-os">${game.platform}</p>
                            <div class="progress"><div class="progress-fill" data-progress="${game.progress}"></div></div>
                        </div>
                        <button class="delete-btn" data-id="${game.id}">✕</button>
                        <div class="percentage">${game.progress}%</div>
                    `;

                    gamesList.appendChild(card);
                });

                document.querySelectorAll('.progress-fill').forEach(bar => {
                    bar.style.width = bar.dataset.progress + '%';
                });

                // Add to Cart Event Listener
                document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const gameName = this.dataset.name;
                        addToCart(gameName);
                    });
                });

                // Delete Game Event Listener
                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const gameId = this.dataset.id;
                        fetch(`http://127.0.0.1:5000/games/${gameId}`, {
                            method: 'DELETE',
                            credentials: 'include',
                        })
                        .then(response => {
                            if (response.ok) {
                                loadGames();
                            } else {
                                console.error('Could not remove game');
                            }
                        })
                        .catch(error => {
                            console.error('Server error during game deletion:', error);
                        });
                    });
                });

                // Search Filter Handler
                const searchInput = document.querySelector('.status input');
                const cards = document.querySelectorAll('.cards');

                searchInput.addEventListener('input', function() {
                    const searchTerm = this.value.toLowerCase();
                    cards.forEach(card => {
                        const gameName = card.querySelector('h2').textContent.toLowerCase();
                        card.style.display = gameName.includes(searchTerm) ? 'flex' : 'none';
                    });
                });
            });
    }
    

    // Fetch User Profile Info
    function loadUserInfo() {
        fetch(`http://127.0.0.1:5000/whoami`, { credentials: 'include' })
            .then(response => response.json())
            .then(data => {
                const nameDisplay = document.querySelector('.user h3');
                nameDisplay.textContent = data.display_name || data.username;
            })
            .catch(error => {
                console.log('Could not load user info:', error);
            });
    }

    // Initial Load Calls
    loadGames();
    loadUserInfo();
    loadNotifications();
    loadCart(); // Added initial load call
});