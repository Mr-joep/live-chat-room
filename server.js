const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const csv = require('csv-parser');
const bcrypt = require('bcrypt');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const { upload, saveImage, saveVideo } = require('./upload'); // Import the upload and save functions

app.use(express.static('public'));
app.use('/images', express.static('images'));
app.use('/videos', express.static('videos'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let users = [];
let chatMessages = [];

// Function to read users from CSV
function readUsersFromCSV() {
    return new Promise((resolve, reject) => {
        const users = [];
        fs.createReadStream('username.csv')
            .pipe(csv(['username', 'password']))
            .on('data', (row) => users.push(row))
            .on('end', () => resolve(users))
            .on('error', (err) => reject(err));
    });
}

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

app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const users = await readUsersFromCSV();
        if (users.some(user => user.username === username)) {
            return res.status(400).send('Username already exists');
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        fs.appendFile('username.csv', `${username},${hashedPassword}\n`, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error registering user');
            }
            res.status(200).send('User registered successfully');
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const users = await readUsersFromCSV();
        const user = users.find(user => user.username === username);
        if (user && bcrypt.compareSync(password, user.password)) {
            return res.status(200).send('Login successful');
        }
        res.status(401).send('Invalid username or password');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});

io.on('connection', (socket) => {
    console.log('a user connected');
    const ipAddress = socket.handshake.address; // Capture the IP address of the connected user

    socket.on('join', (username) => {
        if (users.includes(username)) {
            socket.emit('error', 'Username is already taken');
            return;
        }

        socket.username = username;
        users.push(username);
        io.emit('user joined', { username, users });
        saveIpAddress(username, ipAddress); // Save the user's IP address to a CSV file
    });

    socket.on('chat message', (msg) => {
        const message = { username: socket.username, message: msg, ip: ipAddress };
        chatMessages.push(message); // Add message to array
        io.emit('chat message', message);
        saveChatMessages(); // Save messages to CSV file
    });

    socket.on('image message', (data) => {
        saveImage(data, (err, imagePath) => {
            if (err) return;

            const message = { username: data.username, message: '(Image)', image: imagePath, ip: ipAddress };
            chatMessages.push(message); // Add message to array
            io.emit('image message', message);
            saveChatMessages(); // Save messages to CSV file
        });
    });

    socket.on('video message', (data) => {
        saveVideo(data, (err, videoPath) => {
            if (err) return;

            const message = { username: data.username, message: '(Video)', video: videoPath, ip: ipAddress };
            chatMessages.push(message); // Add message to array
            io.emit('video message', message);
            saveChatMessages(); // Save messages to CSV file
        });
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
        users = users.filter(user => user !== socket.username);
        io.emit('user left', { username: socket.username, users });
    });
});


function saveChatMessages() {
    const csvContent = chatMessages.map(message => {
        if (message.image) {
            return `"${message.username}","${message.message}","${message.image}","${message.ip}"`;
        } else if (message.video) {
            return `"${message.username}","${message.message}","${message.video}","${message.ip}"`;
        } else {
            return `"${message.username}","${message.message}","","${message.ip}"`;
        }
    }).join('\n');
    fs.writeFile('chat_messages.csv', csvContent, 'utf8', (err) => {
        if (err) {
            console.error('Error writing to CSV file:', err);
        } else {
            console.log('Chat messages saved to chat_messages.csv');
        }
    });
}

function saveIpAddress(username, ip) {
    const ipContent = `${username},${ip}\n`;
    fs.appendFile('ip_addresses.csv', ipContent, (err) => {
        if (err) {
            console.error('Error writing to CSV file:', err);
        } else {
            console.log('IP address saved to ip_addresses.csv');
        }
    });
}

server.listen(3000, () => {
    console.log('listening on *:3000');
});
