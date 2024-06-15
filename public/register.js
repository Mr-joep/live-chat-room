document.getElementById('register-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('register-username-input').value;
    const password = document.getElementById('register-password-input').value;

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        if (response.ok) {
            alert('Registration successful. Please login.');
            window.location.href = '/login.html';
        } else {
            alert('Registration failed');
        }
    });
});

document.getElementById('login-link').addEventListener('click', function(event) {
    event.preventDefault();
    window.location.href = '/login.html';
});
