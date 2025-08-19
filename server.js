const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// --- In-Memory Storage ---
let storage = {
    chatUsers: {},
    onlineUsers: {},
    chatMessages: {},
    dmMessages: {},
    userColors: {},
    chatRooms: {},
    roomMessages: {}
};

// --- HTTP Server Setup ---
// We need to create an explicit HTTP server to share with the WebSocket server
const server = http.createServer(app);

// --- Standard REST API for saving/loading initial data ---
app.get('/api/data/:key', (req, res) => {
    const key = req.params.key;
    res.json(storage[key] || {});
});

app.post('/api/data/:key', (req, res) => {
    const key = req.params.key;
    storage[key] = req.body;
    res.json({ success: true });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// --- WebSocket Server Setup ---
const wss = new WebSocketServer({ server });

wss.on('connection', ws => {
    console.log('client connected');

    ws.on('message', message => {
        const data = JSON.parse(message);

        // When we get a new message, broadcast it to all connected clients
        if (data.type === 'chatMessage') {
            // First, save the message to our in-memory storage
            const { id, channel, content } = data.payload;
            if (channel === 'main') {
                storage.chatMessages[id] = content;
            } else if (channel.startsWith('room-')) {
                if (!storage.roomMessages[channel]) storage.roomMessages[channel] = {};
                storage.roomMessages[channel][id] = content;
            } else {
                if (!storage.dmMessages[channel]) storage.dmMessages[channel] = {};
                storage.dmMessages[channel][id] = content;
            }

            // Then, broadcast a "newMessage" event to all clients
            broadcast({ type: 'newMessage', payload: { channel } });
        }
        
        // Handle user list updates (login/logout)
        if (data.type === 'userUpdate') {
            broadcast({ type: 'updateUsers' });
        }
    });

    ws.on('close', () => {
        console.log('client disconnected');
    });
});

// Helper function to send a message to all connected clients
function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === 1) { // 1 means OPEN
            client.send(JSON.stringify(data));
        }
    });
}

// --- Start the Server ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`chat server running on port ${PORT}`);
});
