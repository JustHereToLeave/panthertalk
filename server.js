import express from 'express';
import cors from 'cors';
import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

// --- setup express app ---
const app = express();
app.use(cors());
app.use(express.json());

// --- setup file paths for serving static files ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '.')));

// --- setup lowdb database ---
const defaultData = {
  chatUsers: {},
  onlineUsers: {},
  chatMessages: {},
  dmMessages: {},
  userColors: {},
  chatRooms: {},
  roomMessages: {}
};
const db = await JSONFilePreset('db.json', defaultData);

// --- api endpoints ---

// serve your html file at the root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'beta.html'));
});

// get data from the database
app.get('/api/data/:key', (req, res) => {
    const key = req.params.key;
    if (db.data[key] !== undefined) {
        res.json(db.data[key]);
    } else {
        res.json({});
    }
});

// save data to the database
app.post('/api/data/:key', async (req, res) => {
    const key = req.params.key;
    const data = req.body;
    
    if (db.data[key] !== undefined) {
        db.data[key] = data;
        await db.write(); // save changes to db.json
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: 'key not found' });
    }
});

// --- start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`chat server running on port ${PORT}`);
    console.log(`open http://localhost:${PORT} to use your chat`);
});
