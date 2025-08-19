const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// --- MongoDB Connection ---
const connectionString = process.env.ATLAS_URI; // Your connection string goes here
const client = new MongoClient(connectionString);

let db;

async function connectToDb() {
    try {
        await client.connect();
        console.log("Successfully connected to MongoDB Atlas!");
        db = client.db("panthertalk"); // You can name your database anything
    } catch (err) {
        console.error("Could not connect to MongoDB Atlas", err);
        process.exit(1);
    }
}

connectToDb();

// --- API Endpoints ---

// Serve your html file at the root
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/beta.html');
});

// Get data from a MongoDB collection
app.get('/api/data/:key', async (req, res) => {
    try {
        const collection = db.collection(req.params.key);
        // Find the single document that holds all our data
        const data = await collection.findOne({}) || {};
        res.json(data);
    } catch (err) {
        res.status(500).json({});
    }
});

// Save data to a MongoDB collection
app.post('/api/data/:key', async (req, res) => {
    try {
        const collection = db.collection(req.params.key);
        // Use "upsert" to either update the existing document or create it if it doesn't exist
        await collection.updateOne({}, { $set: req.body }, { upsert: true });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`chat server running on port ${PORT}`);
    console.log(`open http://localhost:${PORT} to use your chat`);
});
