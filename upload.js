const fs = require('fs');
const path = require('path');

function handleImageMessage(data, chatMessages, io, ipAddress) {
    const base64Data = data.image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const imagePath = `images/${uniqueSuffix}.png`;

    fs.writeFile(path.join(__dirname, imagePath), buffer, (err) => {
        if (err) {
            console.error('Error saving image:', err);
            return;
        }
        const message = { username: data.username, message: '(Image)', image: imagePath, ip: ipAddress };
        chatMessages.push(message); // Add message to array
        io.emit('image message', message);
        // Save messages to CSV file (if needed)
        // saveChatMessages(chatMessages);
    });
}

function handleVideoMessage(data, chatMessages, io, ipAddress) {
    const base64Data = data.video.replace(/^data:video\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const videoPath = `videos/${uniqueSuffix}.mp4`;

    fs.writeFile(path.join(__dirname, videoPath), buffer, (err) => {
        if (err) {
            console.error('Error saving video:', err);
            return;
        }
        const message = { username: data.username, message: '(Video)', video: videoPath, ip: ipAddress };
        chatMessages.push(message); // Add message to array
        io.emit('video message', message);
        // Save messages to CSV file (if needed)
        // saveChatMessages(chatMessages);
    });
}

module.exports = {
    handleImageMessage,
    handleVideoMessage
};
