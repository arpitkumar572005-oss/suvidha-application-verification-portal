import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { initStorage } from './storage/db.js';
import { seedDatabase } from './seeds/seedData.js';
import apiRouter from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (sanitized)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`[HTTP] ${req.method} ${req.path} ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Mount REST API
app.use('/api', apiRouter);

// Safe centralized error handling
app.use((err, req, res, next) => {
  console.error('[Error]', err.name, err.message);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File Too Large',
        message: `Maximum allowed file size is ${config.maxFileSizeMb}MB.`
      });
    }
    return res.status(400).json({
      error: 'Upload Error',
      message: err.message
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.isPublic ? err.message : 'An unexpected error occurred. Please try again.';

  return res.status(statusCode).json({
    error: err.name || 'Internal Error',
    message
  });
});

let serverInstance = null;

export async function startServer(port = config.port) {
  try {
    await initStorage();
    await seedDatabase();

    return new Promise((resolve) => {
      serverInstance = app.listen(port, '0.0.0.0', () => {
        console.log(`[Suvidha Portal] Server running on http://127.0.0.1:${port}`);
        console.log(`[Suvidha Portal] Environment: Hackathon Demonstration`);
        resolve(serverInstance);
      });
    });
  } catch (err) {
    console.error('[Suvidha Portal] Startup failed:', err);
    process.exit(1);
  }
}

// Auto-start only when run directly (e.g. node src/server.js)
const isDirectRun = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('src/server.js');
if (isDirectRun) {
  process.on('uncaughtException', (err) => {
    console.warn('[Process] Caught unhandled exception:', err.message);
  });
  process.on('unhandledRejection', (reason) => {
    console.warn('[Process] Caught unhandled rejection:', reason?.message || reason);
  });
  startServer();
}

export { app };
