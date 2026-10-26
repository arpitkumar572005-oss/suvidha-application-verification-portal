import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/suvidha',
  jwtSecret: process.env.JWT_SECRET || 'suvidha_default_dev_secret_key_2026',
  storageMode: process.env.STORAGE_MODE || 'auto',
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5,
  uploadDir: path.resolve(__dirname, '../../uploads'),
  dataDir: path.resolve(__dirname, '../../data'),
  ocrProvider: process.env.OCR_PROVIDER || 'mock',
  demoEnvironment: process.env.DEMO_ENVIRONMENT !== 'false',
};
