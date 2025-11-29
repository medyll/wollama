import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import expressPouchDB from 'express-pouchdb';
import { dbManager } from './db/database.js';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = config.server.port;

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Mount PouchDB Server
// This exposes the databases at /_db/{dbname}
// It uses the same PouchDB constructor as our internal services
// Note: Must be mounted BEFORE express.json() because PouchDB needs the raw stream
app.use('/_db', expressPouchDB(dbManager.getPouchDBConstructor(), {
    inMemoryConfig: config.pouchdb.inMemoryConfig,
    mode: config.pouchdb.mode
}));

app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Serve static files from the client build directory (if needed for standalone server)
// app.use(express.static(path.join(__dirname, '../client/build')));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
