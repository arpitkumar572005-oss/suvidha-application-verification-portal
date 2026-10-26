# Setup and Local Execution Guide

This guide provides step-by-step instructions to install, configure, test, and run the Suvidha portal on your local machine.

---

## 1. System Prerequisites

Before running the application, ensure the following software is installed:

- **Node.js:** Version `18.0.0` or higher (recommended: Node.js 20 LTS).
  - Verify with: `node -v`
- **npm:** Version `9.0.0` or higher (comes bundled with Node.js).
  - Verify with: `npm -v`
- **Operating System:** Windows 10/11, macOS, or Linux.
- **Web Browser:** Modern browser (Chrome, Edge, Firefox, or Safari).
- **Optional Database:** MongoDB Community Edition (v6.0+).  
  *Note:* MongoDB is **completely optional**. If MongoDB is not installed or running, the application automatically uses its built-in persistent JSON file store in `backend/data/`.

---

## 2. Installing Dependencies

The project is structured as a root workspace containing two decoupled packages: `backend` and `frontend`.

### Step 1: Install Backend Dependencies
Open PowerShell or your terminal:
```powershell
cd C:\Users\arpit\.gemini\antigravity\scratch\suvidha-portal\backend
npm install
```
This installs Express, Multer, bcryptjs, jsonwebtoken, Mongoose, uuid, dotenv, and cors.

### Step 2: Install Frontend Dependencies
```powershell
cd C:\Users\arpit\.gemini\antigravity\scratch\suvidha-portal\frontend
npm install
```
This installs React 18, Vite 5, Tailwind CSS, React Router 6, and Lucide React.

---

## 3. Configuring Environment Variables

The backend reads its configuration from `backend/.env`. A pre-configured `.env` file is already provided. If setting up on a new machine, you can copy `.env.example`:

```powershell
cd C:\Users\arpit\.gemini\antigravity\scratch\suvidha-portal\backend
Copy-Item .env.example .env
```

### Explanation of Environment Variables (`backend/.env`)

```ini
# HTTP Server Port
PORT=5000

# MongoDB Connection String (optional, fallback to JSON files if unavailable)
MONGODB_URI=mongodb://localhost:27017/suvidha

# Secret key used for signing JWT Bearer tokens
JWT_SECRET=suvidha_hackathon_demo_secret_key_2026

# Storage Mode: "auto" (tries Mongo, falls back to JSON), "mongodb", or "json"
STORAGE_MODE=auto

# Maximum uploaded document size in Megabytes
MAX_FILE_SIZE_MB=5

# Directory for storing physical uploaded files
UPLOAD_DIR=./uploads

# OCR Provider: "mock" (built-in rule-based adapter)
OCR_PROVIDER=mock
```

---

## 4. Running the Application

### Option A: The One-Click PowerShell Launcher (Recommended on Windows)
From the project root:
```powershell
Set-Location 'C:\Users\arpit\.gemini\antigravity\scratch\suvidha-portal'
.\start-portal.ps1
```
This script launches the backend server on port `5000` and the Vite frontend on port `3000` in separate persistent processes.

---

### Option B: Running in Two Separate Terminals

#### Terminal 1: Backend Server (Port 5000)
```powershell
cd C:\Users\arpit\.gemini\antigravity\scratch\suvidha-portal\backend
npm start
```
*Expected Terminal Output:*
```
[Storage] MongoDB offline or not found (...). Using persistent local JSON store (Development Mode).
[Seed] Database already contains records. Skipping seed.
[Suvidha Portal] Server running on http://localhost:5000
```

#### Terminal 2: Frontend Vite Server (Port 3000)
```powershell
cd C:\Users\arpit\.gemini\antigravity\scratch\suvidha-portal\frontend
npm run dev -- --host 0.0.0.0 --port 3000
```
*Expected Terminal Output:*
```
  VITE v5.4.8  ready in 420 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
```

---

## 5. Opening the Application in Your Browser

Open your browser and navigate to:
```
http://localhost:3000
```

### Pre-Seeded Profiles for Instant Evaluation

You can sign in with any of these pre-seeded profiles or use the **"Portal View"** switcher in the top navigation bar:

| Role | Name | Email | Password | Primary Destination |
| :--- | :--- | :--- | :--- | :--- |
| **Citizen / Applicant** | Arpit Kumar | `arpit@example.com` | `Demo@123` | `/applicant/dashboard` |
| **Verification Officer** | Priya Sharma | `reviewer@suvidha.gov.demo` | `Demo@123` | `/reviewer/dashboard` |
| **Compliance Officer** | Sunil Verma | `compliance@suvidha.gov.demo` | `Demo@123` | `/compliance/rules` |
| **System Administrator** | Rajesh Patel | `admin@suvidha.gov.demo` | `Demo@123` | `/admin/audit-logs` |

---

## 6. Running Automated Tests

The codebase includes an automated test suite executed via the Node.js built-in test runner:

```powershell
cd C:\Users\arpit\.gemini\antigravity\scratch\suvidha-portal\backend
npm test
```

### Tested Capabilities:
1. `GET /api/health` returns healthy status and portal identity.
2. `GET /api/auth/demo-accounts` returns pre-seeded credential list.
3. `POST /api/auth/login` succeeds for sample applicant Arpit Kumar.
4. `POST /api/auth/login` fails cleanly for invalid password.
5. `GET /api/applications` returns records scoped to authenticated applicant.
6. Reviewer login and verification workspace retrieval.
7. `ComparisonEngine` accurately identifies matching vs mismatching fields using Levenshtein distance.
8. `RiskScoringEngine` calculates explainable penalty scores and never declares fraud.

All 8 tests should pass with `0` failures.
