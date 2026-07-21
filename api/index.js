import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Servir archivos estáticos de la aplicación frontend compilada
const publicDir = path.join(__dirname, '../artifacts/roblox-studio-ai/dist/public');
app.use(express.static(publicDir));

// SPA fallback: todas las rutas que no son archivos estáticos, servir index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

export default app;
