const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Set up storage for images and videos using multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, 'images');
        } else if (file.mimetype.startsWith('video/')) {
            cb(null, 'videos');
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.use(express.static('public'));
app.use('/images', express.static('images'));
app.use('/videos', express.static('videos'));

let users = [];
let chatMessages = []; // Array to store chat messages

io.on('connection', (socket) => {
    console.log('a user connected');
    const ipAddress = socket.handshake.address; // Capture the IP address of the connected user

    socket.on('join', (username) => {
        socket.username = username;
        users.push(username);
        io.emit('user joined', { username, users });
    });

    socket.on('chat message', (msg) => {
        const message = { username: socket.username, message: msg, ip: ipAddress };
        chatMessages.push(message); // Add message to array
        io.emit('chat message', message);
        saveChatMessages(); // Save messages to CSV file
    });

    socket.on('image message', (data) => {
        const base64Data = data.image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const imagePath = `images/${uniqueSuffix}.png`;

        fs.writeFile(imagePath, buffer, (err) => {
            if (err) {
                console.error('Error saving image:', err);
                return;
            }
            const message = { username: data.username, message: '(Image)', image: imagePath, ip: ipAddress };
            chatMessages.push(message); // Add message to array
            io.emit('image message', message);
            saveChatMessages(); // Save messages to CSV file
        });
    });

    socket.on('video message', (data) => {
        const base64Data = data.video.replace(/^data:video\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const videoPath = `videos/${uniqueSuffix}.mp4`;

        fs.writeFile(videoPath, buffer, (err) => {
            if (err) {
                console.error('Error saving video:', err);
                return;
            }
            const message = { username: data.username, message: '(Video)', video: videoPath, ip: ipAddress };
            chatMessages.push(message); // Add message to array
            io.emit('video message', message);
            saveChatMessages(); // Save messages to CSV file
        });
    });

    socket.on('typing', () => {
        socket.broadcast.emit('typing', socket.username);
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

server.listen(3000, () => {
    console.log('listening on *:3000');
});
