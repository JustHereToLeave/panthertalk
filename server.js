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
// updated data store for channel-specific pinned messages
let pinnedMessages = {}; 

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
        case 'pinnedMessages': pinnedMessages = data; break;
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
        messageLog[messageId].edited = true;
        
        // also update in channel-specific pinned messages if it exists there
        if (pinnedMessages[channel] && pinnedMessages[channel][messageId]) {
            pinnedMessages[channel][messageId].text = newText;
            pinnedMessages[channel][messageId].edited = true;
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
        // also delete from channel-specific pinned messages
        if (pinnedMessages[channel] && pinnedMessages[channel][messageId]) {
            delete pinnedMessages[channel][messageId];
        }
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: 'message not found' });
    }
});

// updated endpoint for pinning/unpinning messages by channel
app.post('/api/togglePin', (req, res) => {
    const { messageId, channel } = req.body;
    
    // ensure the channel exists in the pinnedMessages object
    if (!pinnedMessages[channel]) {
        pinnedMessages[channel] = {};
    }

    if (pinnedMessages[channel][messageId]) {
        // if already pinned in this channel, unpin it
        delete pinnedMessages[channel][messageId];
        res.json({ success: true, pinned: false });
    } else {
        // if not pinned, find the original message and pin it
        let messageLog;
        if (channel === 'main') messageLog = chatMessages;
        else if (channel.startsWith('room-')) messageLog = roomMessages[channel];
        else messageLog = dmMessages[channel];

        if (messageLog && messageLog[messageId]) {
            pinnedMessages[channel][messageId] = messageLog[messageId];
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
