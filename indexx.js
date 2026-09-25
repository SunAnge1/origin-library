const cartDropdown = document.getElementById('cartDropdown');
const cartBadge = document.getElementById('cartBadge');
const cartList = document.getElementById('cartList');
const emptyList = document.getElementById('emptyList');
const clearList = document.getElementById('clearList');

//toggle dropdown visiblity
cartIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    cartDropdown.classList.toggle('hidden');
});

// Close Dropdown On Outside Click
document.addEventListener('click', (e) => {
    if (!cartDropdown.contains(e.target) && e.target !== notifIcon) {
        cartDropdown.classList.add('hidden');
    }
});
