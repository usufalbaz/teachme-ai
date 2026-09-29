import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { setupLiveWebSocket, assessPronunciationText, generateCoachSpokenTurn } from './server/geminiService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

app.use(express.json());

// API endpoints
app.post('/api/assess-pronunciation', async (req, res) => {
  try {
    const { spokenText, targetContext, level } = req.body;
    const result = await assessPronunciationText(spokenText || '', targetContext || '', level || 'B1');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Assessment failed' });
  }
});

app.post('/api/chat-coach', async (req, res) => {
  try {
    const { history, scenarioInstruction, level } = req.body;
    const text = await generateCoachSpokenTurn(history || [], scenarioInstruction || '', level || 'B1');
    res.json({ text });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Chat failed' });
  }
});

// Setup Live API WebSocket server on path /api/live
const wss = new WebSocketServer({ noServer: true });
setupLiveWebSocket(wss);

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  if (url.pathname === '/api/live') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

// Serve static frontend in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

server.listen(port, () => {
  console.log(`TeachMe production server listening on port ${port}`);
});
