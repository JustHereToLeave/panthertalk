const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

let chatUsers = {};
let onlineUsers = {};
let chatMessages = {};
let dmMessages = {};
let userColors = {};
let chatRooms = {};
let roomMessages = {};
let userProfiles = {};

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/api/data/:key', (req, res) => {
    const key = req.params.key;
    const data = {
        chatUsers, onlineUsers, chatMessages, dmMessages, userColors, chatRooms, roomMessages, userProfiles
    };
    res.json(data[key] || {});
});

app.post('/api/data/:key', (req, res) => {
    const key = req.params.key;
    const data = req.body;
    switch(key) {
        case 'chatUsers': chatUsers = data; break;
        case 'onlineUsers': onlineUsers = data; break;
        case 'chatMessages': chatMessages = data; break;
        case 'dmMessages': dmMessages = data; break;
        case 'userColors': userColors = data; break;
        case 'chatRooms': chatRooms = data; break;
        case 'roomMessages': roomMessages = data; break;
        case 'userProfiles': userProfiles = data; break;
    }
    res.json({ success: true });
});

// --- NEW: Endpoint for Editing a Message ---
app.post('/api/editMessage', (req, res) => {
    const { messageId, channel, newText } = req.body;
    let messageLog;

    if (channel === 'main') {
        messageLog = chatMessages;
    } else if (channel.startsWith('room-')) {
        messageLog = roomMessages[channel];
    } else {
        messageLog = dmMessages[channel];
    }

    if (messageLog && messageLog[messageId]) {
        messageLog[messageId].text = newText + ' (edited)';
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: 'Message not found' });
    }
});

// --- NEW: Endpoint for Deleting a Message ---
app.post('/api/deleteMessage', (req, res) => {
    const { messageId, channel } = req.body;
    let messageLog;

    if (channel === 'main') {
        messageLog = chatMessages;
    } else if (channel.startsWith('room-')) {
        messageLog = roomMessages[channel];
    } else {
        messageLog = dmMessages[channel];
    }

    if (messageLog && messageLog[messageId]) {
        delete messageLog[messageId];
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: 'Message not found' });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`chat server running on port ${PORT}`);
});
