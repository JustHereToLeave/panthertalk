const express = require('express');
const cors = require('cors');
const { Redis } = require('@upstash/redis');
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' })); // bumped limit so profile pictures (base64) fit
app.use(express.static('.'));

// ---------- PERSISTENCE SETUP (Upstash Redis — survives Koyeb sleep/restarts) ----------
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
});
const STORE_KEY = 'panthertalk_store'; // everything is saved under this one key

// Default shape used if nothing has been saved yet (first run ever)
let store = {
    chatUsers: {},
    onlineUsers: {},
    chatMessages: {},
    dmMessages: {},
    userColors: {},
    chatRooms: {},
    roomMessages: {},
    userProfiles: {},
    pinnedMessages: {}
};

// Load saved data from Upstash on startup (if any exists)
async function loadData() {
    try {
        const saved = await redis.get(STORE_KEY);
        if (saved) {
            store = { ...store, ...saved };
            console.log('Loaded existing data from Upstash');
        } else {
            console.log('No saved data found, starting fresh');
        }
    } catch (err) {
        console.error('Failed to load from Upstash, starting fresh:', err);
    }
}

// Save current state to Upstash. Debounced so rapid-fire requests
// (e.g. many messages at once) don't fire off a request per change.
let saveTimeout = null;
function saveData() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
        try {
            await redis.set(STORE_KEY, store);
        } catch (err) {
            console.error('Failed to save to Upstash:', err);
        }
    }, 250); // waits 250ms after the last change before writing
}

// ---------- ROUTES ----------

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/api/data/:key', (req, res) => {
    const key = req.params.key;
    res.json(store[key] || {});
});

app.post('/api/data/:key', (req, res) => {
    const key = req.params.key;
    const data = req.body;
    if (Object.prototype.hasOwnProperty.call(store, key)) {
        store[key] = data;
        saveData();
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, message: 'unknown key' });
    }
});

app.post('/api/editMessage', (req, res) => {
    const { messageId, channel, newText } = req.body;
    let messageLog;

    if (channel === 'main') {
        messageLog = store.chatMessages;
    } else if (channel.startsWith('room-')) {
        messageLog = store.roomMessages[channel];
    } else {
        messageLog = store.dmMessages[channel];
    }

    if (messageLog && messageLog[messageId]) {
        messageLog[messageId].text = newText;
        messageLog[messageId].edited = true;

        // also update in channel-specific pinned messages if it exists there
        if (store.pinnedMessages[channel] && store.pinnedMessages[channel][messageId]) {
            store.pinnedMessages[channel][messageId].text = newText;
            store.pinnedMessages[channel][messageId].edited = true;
        }

        saveData();
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: 'message not found' });
    }
});

app.post('/api/deleteMessage', (req, res) => {
    const { messageId, channel } = req.body;
    let messageLog;

    if (channel === 'main') {
        messageLog = store.chatMessages;
    } else if (channel.startsWith('room-')) {
        messageLog = store.roomMessages[channel];
    } else {
        messageLog = store.dmMessages[channel];
    }

    if (messageLog && messageLog[messageId]) {
        delete messageLog[messageId];
        // also delete from channel-specific pinned messages
        if (store.pinnedMessages[channel] && store.pinnedMessages[channel][messageId]) {
            delete store.pinnedMessages[channel][messageId];
        }
        saveData();
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: 'message not found' });
    }
});

// updated endpoint for pinning/unpinning messages by channel
app.post('/api/togglePin', (req, res) => {
    const { messageId, channel } = req.body;

    // ensure the channel exists in the pinnedMessages object
    if (!store.pinnedMessages[channel]) {
        store.pinnedMessages[channel] = {};
    }

    if (store.pinnedMessages[channel][messageId]) {
        // if already pinned in this channel, unpin it
        delete store.pinnedMessages[channel][messageId];
        saveData();
        res.json({ success: true, pinned: false });
    } else {
        // if not pinned, find the original message and pin it
        let messageLog;
        if (channel === 'main') messageLog = store.chatMessages;
        else if (channel.startsWith('room-')) messageLog = store.roomMessages[channel];
        else messageLog = store.dmMessages[channel];

        if (messageLog && messageLog[messageId]) {
            store.pinnedMessages[channel][messageId] = messageLog[messageId];
            saveData();
            res.json({ success: true, pinned: true });
        } else {
            res.status(404).json({ success: false, message: 'message not found' });
        }
    }
});

const PORT = process.env.PORT || 3000;

// wait for saved data to load before accepting traffic
loadData().then(() => {
    app.listen(PORT, () => {
        console.log(`chat server running on port ${PORT}`);
    });
});
