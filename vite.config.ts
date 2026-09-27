import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { WebSocketServer } from 'ws';
import { setupLiveWebSocket, assessPronunciationText, generateCoachSpokenTurn } from './server/geminiService';

function liveWsPlugin(): Plugin {
  return {
    name: 'teachme-live-ws',
    configureServer(server) {
      if (server.httpServer) {
        const wss = new WebSocketServer({ noServer: true });
        setupLiveWebSocket(wss);

        server.httpServer.on('upgrade', (request, socket, head) => {
          const url = new URL(request.url || '', `http://${request.headers.host}`);
          if (url.pathname === '/api/live') {
            wss.handleUpgrade(request, socket, head, (ws) => {
              wss.emit('connection', ws, request);
            });
          }
        });
      }

      // API route: /api/assess-pronunciation
      server.middlewares.use('/api/assess-pronunciation', async (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const { spokenText, targetContext, level } = JSON.parse(body || '{}');
              const result = await assessPronunciationText(spokenText || '', targetContext || '', level || 'B1');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'Assessment failed' }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end();
        }
      });

      // API route: /api/chat-coach
      server.middlewares.use('/api/chat-coach', async (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const { history, scenarioInstruction, level } = JSON.parse(body || '{}');
              const text = await generateCoachSpokenTurn(history || [], scenarioInstruction || '', level || 'B1');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ text }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'Coach response failed' }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end();
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), liveWsPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
