const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// in-memory storage (resets when server restarts)
let chatUsers = {};
let onlineUsers = {};
let chatMessages = {};
let dmMessages = {};
let userColors = {};
let chatRooms = {};
let roomMessages = {};
let userProfiles = {};
let pinnedMessages = {}; 

// serve your html file at the root
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// get all data
app.get('/api/data/:key', (req, res) => {
    const key = req.params.key;
    const data = {
        chatUsers, onlineUsers, chatMessages, dmMessages, userColors, chatRooms, roomMessages, userProfiles, pinnedMessages
    };
    res.json(data[key] || {});
});

// save data
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
        case 'pinnedMessages': pinnedMessages = data; break;
    }
    res.json({ success: true });
});

// Endpoint for Editing a Message
app.post('/api/editMessage', (req, res) => {
    const { messageId, channel, newText, username } = req.body;
    let messageLog;

    if (channel === 'main') messageLog = chatMessages;
    else if (channel.startsWith('room-')) messageLog = roomMessages[channel];
    else messageLog = dmMessages[channel];

    if (messageLog && messageLog[messageId] && messageLog[messageId].username === username) {
        messageLog[messageId].text = newText;
        messageLog[messageId].edited = true;
        res.json({ success: true });
    } else {
        res.status(403).json({ success: false, message: 'Unauthorized or message not found' });
    }
});

// Endpoint for Deleting a Message
app.post('/api/deleteMessage', (req, res) => {
    const { messageId, channel, username } = req.body;
    let messageLog;

    if (channel === 'main') messageLog = chatMessages;
    else if (channel.startsWith('room-')) messageLog = roomMessages[channel];
    else messageLog = dmMessages[channel];

    if (messageLog && messageLog[messageId] && messageLog[messageId].username === username) {
        delete messageLog[messageId];
        res.json({ success: true });
    } else {
        res.status(403).json({ success: false, message: 'Unauthorized or message not found' });
    }
});

// Endpoint for Pinning a Message
app.post('/api/pinMessage', (req, res) => {
    const { channel, messageId } = req.body;
    if (!Array.isArray(pinnedMessages[channel])) {
        pinnedMessages[channel] = [];
    }
    if (!pinnedMessages[channel].includes(messageId)) {
        pinnedMessages[channel].push(messageId);
    }
    res.json({ success: true });
});

// Endpoint for Unpinning a Message
app.post('/api/unpinMessage', (req, res) => {
    const { channel, messageId } = req.body;
    if (Array.isArray(pinnedMessages[channel])) {
        pinnedMessages[channel] = pinnedMessages[channel].filter(id => id !== messageId);
    }
    res.json({ success: true });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`chat server running on port ${PORT}`);
});
