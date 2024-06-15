const fs = require('fs');

function saveChatMessages(chatMessages) {
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

function saveUser(username, hashedPassword) {
    const userContent = `${username},${hashedPassword}\n`;
    fs.appendFile('username.csv', userContent, (err) => {
        if (err) {
            console.error('Error writing to CSV file:', err);
        } else {
            console.log('User saved to username.csv');
        }
    });
}

module.exports = {
    saveChatMessages,
    saveIpAddress,
    saveUser
};
