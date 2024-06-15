const socket = io();
let usernameSet = false;

document.addEventListener('DOMContentLoaded', (event) => {
    const username = localStorage.getItem('username');
    if (username) {
        socket.username = username;
        socket.emit('join', username);
        usernameSet = true;
        document.getElementById('message-input').removeAttribute('disabled');
    }
});

document.getElementById('message-input').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    } else {
        socket.emit('typing', socket.username);
    }
});

function sendMessage() {
    if (!usernameSet) {
        alert("Please log in before you can chat.");
        return;
    }
    const input = document.getElementById('message-input');
    const message = input.value;
    if (message) {
        socket.emit('chat message', message);
        input.value = '';
        scrollToBottom();
    }
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
        const imageData = event.target.result;
        socket.emit('image message', { username: socket.username, image: imageData });
    };
    reader.readAsDataURL(file);
}

function handleVideoUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
        const videoData = event.target.result;
        socket.emit('video message', { username: socket.username, video: videoData });
    };
    reader.readAsDataURL(file);
}

socket.on('chat message', (data) => {
    const item = document.createElement('li');
    item.textContent = `${data.username}: ${data.message}`;
    item.className = 'list-group-item';
    document.getElementById('messages').appendChild(item);
    scrollToBottom();
});

socket.on('image message', (data) => {
    const item = document.createElement('li');
    const image = document.createElement('img');
    image.src = `/${data.image}`;
    image.style.maxWidth = '200px';
    item.appendChild(image);
    item.className = 'list-group-item';
    document.getElementById('messages').appendChild(item);
    scrollToBottom();
});

socket.on('video message', (data) => {
    const item = document.createElement('li');
    const video = document.createElement('video');
    video.src = `/${data.video}`;
    video.controls = true;
    video.style.maxWidth = '200px';
    item.appendChild(video);
    item.className = 'list-group-item';
    document.getElementById('messages').appendChild(item);
    scrollToBottom();
});

socket.on('user joined', (data) => {
    updateOnlineUsers(data.users);
    const item = document.createElement('li');
    item.textContent = `${data.username} joined the chat`;
    item.className = 'list-group-item italic';
    document.getElementById('messages').appendChild(item);
    scrollToBottom();
});

socket.on('user left', (data) => {
    updateOnlineUsers(data.users);
    const item = document.createElement('li');
    item.textContent = `${data.username} left the chat`;
    item.className = 'list-group-item italic';
    document.getElementById('messages').appendChild(item);
    scrollToBottom();
});

socket.on('typing', (username) => {
    showTypingIndicator(username);
});

function updateOnlineUsers(users) {
    const usersList = document.getElementById('users-list');
    usersList.innerHTML = '';
    users.forEach(user => {
        const item = document.createElement('li');
        item.textContent = user;
        item.className = 'list-group-item';
        usersList.appendChild(item);
    });
}

function showTypingIndicator(username) {
    const typingIndicator = document.getElementById('typing-indicator');
    typingIndicator.textContent = `${username} is typing...`;
    typingIndicator.style.display = 'block';
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    typingIndicator.style.display = 'none';
}

document.getElementById('message-input').addEventListener('blur', () => {
    hideTypingIndicator();
});

function scrollToBottom() {
    const messagesContainer = document.getElementById('messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
