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
let pinnedMessages = {}; // new data store for pinned messages

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/api/data/:key', (req, res) => {
    const key = req.params.key;
    const data = {
        chatUsers, onlineUsers, chatMessages, dmMessages, userColors, chatRooms, roomMessages, userProfiles, pinnedMessages
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
        case 'pinnedMessages': pinnedMessages = data; break; // handle pinned messages
    }
    res.json({ success: true });
});

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
        messageLog[messageId].text = newText;
        messageLog[messageId].edited = true; // mark as edited
        
        // also update in pinned messages if it exists there
        if (pinnedMessages[messageId]) {
            pinnedMessages[messageId].text = newText;
            pinnedMessages[messageId].edited = true;
        }

        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: 'message not found' });
    }
});

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
        // also delete from pinned messages
        if (pinnedMessages[messageId]) {
            delete pinnedMessages[messageId];
        }
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: 'message not found' });
    }
});

// new endpoint for pinning/unpinning messages
app.post('/api/togglePin', (req, res) => {
    const { messageId, channel } = req.body;
    
    if (pinnedMessages[messageId]) {
        // if already pinned, unpin it
        delete pinnedMessages[messageId];
        res.json({ success: true, pinned: false });
    } else {
        // if not pinned, find the original message and pin it
        let messageLog;
        if (channel === 'main') messageLog = chatMessages;
        else if (channel.startsWith('room-')) messageLog = roomMessages[channel];
        else messageLog = dmMessages[channel];

        if (messageLog && messageLog[messageId]) {
            pinnedMessages[messageId] = messageLog[messageId];
            res.json({ success: true, pinned: true });
        } else {
            res.status(404).json({ success: false, message: 'message not found' });
        }
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`chat server running on port ${PORT}`);
});
