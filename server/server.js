import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

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
