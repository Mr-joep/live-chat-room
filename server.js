const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const csv = require('csv-parser');
const bcrypt = require('bcrypt');
const fs = require('fs'); // Import fs module here
const { saveChatMessages, saveIpAddress, saveUser } = require('./save');
const { handleImageMessage, handleVideoMessage } = require('./upload');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));
app.use('/images', express.static('images'));
app.use('/videos', express.static('videos'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let users = [];
let chatMessages = []; // Array to store chat messages

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Serve login page
app.get('/login.html', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

// Serve chat page
app.get('/chat', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Serve register page
app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/public/register.html');
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;

    let usernameExists = false;
    fs.createReadStream('username.csv')
        .pipe(csv(['username', 'password']))
        .on('data', (row) => {
            if (row.username === username) {
                usernameExists = true;
            }
        })
        .on('end', () => {
            if (usernameExists) {
                res.status(400).send('Username already exists');
            } else {
                const hashedPassword = bcrypt.hashSync(password, 10);
                saveUser(username, hashedPassword);
                res.status(200).send('User registered successfully');
            }
        });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = [];

    fs.createReadStream('username.csv')
        .pipe(csv(['username', 'password']))
        .on('data', (row) => {
            users.push(row);
        })
        .on('end', () => {
            const user = users.find((u) => u.username === username);
            if (user && bcrypt.compareSync(password, user.password)) {
                res.status(200).send('Login successful');
            } else {
                res.status(401).send('Invalid username or password');
            }
        });
});

io.on('connection', (socket) => {
    const ipAddress = socket.handshake.address; // Capture the IP address of the connected user
    console.log(`A user connected. IP: ${ipAddress}`);

    socket.on('join', (username) => {
        socket.username = username;
        users.push(username);
        io.emit('user joined', { username, users });
        saveIpAddress(username, ipAddress); // Save the user's IP address to a CSV file
    });

    socket.on('chat message', (msg) => {
        const message = { username: socket.username, message: msg, ip: ipAddress };
        chatMessages.push(message); // Add message to array
        io.emit('chat message', message);
        saveChatMessages(chatMessages); // Save messages to CSV file
    });

    socket.on('image message', (data) => {
        handleImageMessage(data, chatMessages, io, ipAddress);
    });

    socket.on('video message', (data) => {
        handleVideoMessage(data, chatMessages, io, ipAddress);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected. IP: ${ipAddress}`);
        users = users.filter(user => user !== socket.username);
        io.emit('user left', { username: socket.username, users });
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
