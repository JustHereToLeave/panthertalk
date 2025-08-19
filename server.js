const express = require('express');
const cors = require('cors');
const app = express();

// enable cors and json parsing
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // serve your html file

// in-memory storage (resets when server restarts)
let chatUsers = {};
let onlineUsers = {};
let chatMessages = {};
let dmMessages = {};
let userColors = {};

// serve your html file at the root
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// get all data (replaces localStorage.getItem)
app.get('/api/data/:key', (req, res) => {
    const key = req.params.key;
    
    switch(key) {
        case 'chatUsers':
            res.json(chatUsers);
            break;
        case 'onlineUsers':
            res.json(onlineUsers);
            break;
        case 'chatMessages':
            res.json(chatMessages);
            break;
        case 'dmMessages':
            res.json(dmMessages);
            break;
        case 'userColors':
            res.json(userColors);
            break;
        default:
            res.json({});
    }
});

// save data (replaces localStorage.setItem)
app.post('/api/data/:key', (req, res) => {
    const key = req.params.key;
    const data = req.body;
    
    switch(key) {
        case 'chatUsers':
            chatUsers = data;
            break;
        case 'onlineUsers':
            onlineUsers = data;
            break;
        case 'chatMessages':
            chatMessages = data;
            break;
        case 'dmMessages':
            dmMessages = data;
            break;
        case 'userColors':
            userColors = data;
            break;
    }
    
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`chat server running on port ${PORT}`);
    console.log(`open http://localhost:${PORT} to use your chat`);
});