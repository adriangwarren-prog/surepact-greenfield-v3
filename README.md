# SurePact Greenfield v2: Grant Ingestion Engine

This repository represents the prototype environment for **Grant Ingestion & AI Parsing** for SurePact. It contains:
* **Frontend**: React application (located in the `/client` directory).
* **Backend**: Node.js/Express API with Prisma ORM and SQLite (located in the `/server` directory).

---

## 🚀 Developer Onboarding Guide (Option A Setup)

Follow these steps to run the application locally on your machine.

### 1. Prerequisites
Ensure you have the following installed on your local machine:
* **Node.js** (v18.0.0 or higher)
* **Git**
* **Antigravity** (AI developer assistant)

---

### 2. Repository Setup

Clone this repository to your projects directory:
```bash
git clone https://github.com/adriangwarren-prog/surepact-greenfield.git
cd surepact-greenfield
```

---

### 3. Backend & Database Configuration

1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your local environment file:
   * Copy the `.env.example` template to a new file named `.env`:
     ```bash
     cp .env.example .env
     ```
   * Open `.env` in a text editor and fill in the required keys:
     * `GEMINI_API_KEY`: API Key for Google Gemini (`AQ.Ab8...`).
     * `PLATFORM_PASSWORD`: Password for authenticating the portal (Default: `SurePact2026!`).
4. Initialize the SQLite database and run Prisma migrations:
   ```bash
   npx prisma db push
   ```
5. Seed the database with default grants, expected payment installments, and default staff users (Sarah, Michael, Elena, David, Bianca):
   ```bash
   npm run seed
   ```
6. Start the local API server:
   ```bash
   npm run dev
   ```
   The backend API will run on `http://localhost:3000`.

---

### 4. Frontend Configuration

1. Open a new terminal session and navigate to the `client/` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your local environment file:
   * Copy the `.env.example` template to a new file named `.env`:
     ```bash
     cp .env.example .env
     ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser. Log in using the platform password (e.g. `SurePact2026!`).

---

### 5. Restoring Antigravity Chat Context

To allow Antigravity on your machine to understand the full context of the code and changes:
1. Open Antigravity and start a new chat session to generate a local conversation ID.
2. Close the Antigravity application.
3. Download the zipped `logs/` folder provided on SharePoint.
4. Extract and copy `transcript.jsonl` and `transcript_full.jsonl` into the newly created local conversation folder:
   `C:\Users\<Username>\.gemini\antigravity\brain\<new-conversation-id>\.system_generated\logs\`
5. Re-open Antigravity. The chat will show the full development trajectory.
