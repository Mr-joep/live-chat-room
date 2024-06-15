const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

function saveImage(data, callback) {
    const base64Data = data.image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const imagePath = `images/${uniqueSuffix}.png`;

    fs.writeFile(imagePath, buffer, (err) => {
        if (err) {
            console.error('Error saving image:', err);
            return callback(err);
        }
        callback(null, imagePath);
    });
}

function saveVideo(data, callback) {
    const base64Data = data.video.replace(/^data:video\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const videoPath = `videos/${uniqueSuffix}.mp4`;

    fs.writeFile(videoPath, buffer, (err) => {
        if (err) {
            console.error('Error saving video:', err);
            return callback(err);
        }
        callback(null, videoPath);
    });
}

module.exports = {
    upload,
    saveImage,
    saveVideo
};
