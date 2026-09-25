document.addEventListener('DOMContentLoaded', function () {
    const authForm = document.getElementById('authForm');
    const formTitle = document.getElementById('formTitle');
    const submitBtn = document.getElementById('submitBtn');
    const toggleLink = document.getElementById('toggleLink');
    const toggleText = document.getElementById('toggleText');
    const authMessage = document.getElementById('authMessage');

    // Track whether we are in Login or Register mode
    let isLoginMode = true;

    // Toggle between Login and Register views
    toggleLink.addEventListener('click', function (e) {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        
        // Clear old error/success messages
        authMessage.style.display = 'none';

        

        if (isLoginMode) {
            document.getElementById('displayName').classList.toggle('hidden')
            document.getElementById('email').classList.toggle('hidden')
            formTitle.textContent = 'Welcome';
            submitBtn.textContent = 'Login';
            toggleText.textContent = 'Need an account?';
            toggleLink.textContent = 'Register';
        } else {
            document.getElementById('displayName').classList.toggle('hidden')
            document.getElementById('email').classList.toggle('hidden')
            formTitle.textContent = 'Create Account';
            submitBtn.textContent = 'Sign Up';
            toggleText.textContent = 'Already have an account?';
            toggleLink.textContent = 'Login';
        }
    });

    // Form submission logic
    authForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const displayName = document.getElementById('displayName').value;
        const email = document.getElementById('email').value;


        // Choose endpoint based on current mode
        const endpoint = isLoginMode ? '/login' : '/register';
        const url = `http://127.0.0.1:5000${endpoint}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password, display_name:displayName, email })
            });

            const data = await response.json();

            if (response.ok) {
                if (isLoginMode) {
                    // Successful Login
                    localStorage.setItem('user', JSON.stringify(data));
                    window.location.href = 'index.html';
                } else {
                    // Successful Registration
                    authMessage.style.color = '#4EFA8A';
                    authMessage.textContent = 'Account created! Switch to Login to sign in.';
                    authMessage.style.display = 'block';
                }
            } else {
                // Show server error message (e.g. "Username already taken" or "Invalid credentials")
                authMessage.style.color = '#ff4d4d';
                authMessage.textContent = data.message || 'Something went wrong';
                authMessage.style.display = 'block';
            }
        } catch (error) {
            authMessage.style.color = '#ff4d4d';
            authMessage.textContent = 'Server error. Is Flask running?';
            authMessage.style.display = 'block';
        }
    });
});