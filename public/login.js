document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('login-username-input').value;
    const password = document.getElementById('login-password-input').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        if (response.ok) {
            localStorage.setItem('username', username);
            window.location.href = '/';
        } else {
            alert('Login failed');
        }
    });
});

document.getElementById('register-link').addEventListener('click', function(event) {
    event.preventDefault();
    window.location.href = '/register.html';
});
