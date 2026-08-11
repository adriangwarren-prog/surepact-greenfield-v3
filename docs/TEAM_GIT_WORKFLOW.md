# 🤝 SurePact Team Git & AI Collaboration Guide

This document outlines the step-by-step feature-branch workflow for collaborating on **SurePact Greenfield** with **Antigravity**. By using isolated Git feature branches paired with Vercel Preview Deployments, multiple team members (e.g. Founder & Head of Product) can build, test, and preview features simultaneously without breaking the `main` code branch or database state.

---

## 🛠️ Section 1: Initial Setup for Head of Product

Follow these 4 steps on your local machine to onboard into the project:

### Step 1: Install Antigravity & Node.js
1. Download and install the **Antigravity AI Assistant** client.
2. Download and install **Node.js** (v18 or higher).
3. Verify Antigravity created its default system folder:
   * **Windows**: `C:\Users\<YourUsername>\.gemini\antigravity`

### Step 2: Clone the GitHub Repository
Open PowerShell or Terminal and run:
```powershell
# Create a development projects directory
mkdir C:\Users\$env:USERNAME\projects
cd C:\Users\$env:USERNAME\projects

# Clone the repository
git clone https://github.com/adriangwarren-prog/surepact-greenfield.git
cd surepact-greenfield
```

### Step 3: Import Conversation History & Context
To give your local Antigravity agent complete context of everything built to date:
1. Start a new chat session in Antigravity to generate a new conversation folder under:
   `C:\Users\<YourUsername>\.gemini\antigravity\brain\<new-conversation-id>\`
2. Download the attached transcript log files (`transcript.jsonl` and `transcript_full.jsonl`).
3. Close Antigravity, then copy both files into your machine's system logs folder:
   `C:\Users\<YourUsername>\.gemini\antigravity\brain\<new-conversation-id>\.system_generated\logs\`
4. Re-open Antigravity. Your agent now has the full transcript history of all features, architecture decisions, and code conventions.

### Step 4: Install Dependencies & Run Locally
```powershell
# Install & start backend API server
cd server
npm install
npx prisma db push
npm run dev

# Open a second terminal for the frontend client
cd client
npm install
npm run dev
```
* Access local app at: `http://localhost:5173`

---

## 🌿 Section 2: Daily Feature Branch Workflow

Never make code changes directly on `main`. Follow this 4-step feature branch loop:

1. **Create a Feature Branch**:
   Ask Antigravity: *"Create a new git feature branch called `feature/product-<feature-name>`."*
2. **Instruct Antigravity to Build**:
   Prompt your local Antigravity instance as normal. Antigravity will write code, test TypeScript builds, and run unit tests directly inside your isolated branch.
3. **Push Branch & Get Vercel Preview Link**:
   Tell Antigravity: *"Push this feature branch to GitHub and get the Vercel Preview Link."*
   Vercel will automatically build a dedicated, live test URL:
   `https://surepact-greenfield-git-feature-product-<feature-name>-adriansurepact.vercel.app`
4. **Syncing & Merging into Main**:
   Ask Antigravity: *"Pull latest main into my branch and resolve any merge conflicts."*
   Antigravity will automatically merge `origin/main`, inspect conflicting code lines, verify TypeScript compilation (`npm run build`), and push the clean result.

---

## 🤖 Section 3: Antigravity Session Startup Prompt

Copy and paste this prompt into your Antigravity chat whenever starting a new working session:

```text
Please initialize our session by inspecting recent git commits (`git log -n 5`) and reviewing the latest walkthrough artifact [walkthrough.md](file:///path/to/walkthrough.md). Confirm what branch we are on and summarize the latest updates made across the team before we begin.
```

---

## 📌 Naming Conventions

* **Product Features**: `feature/product-<description>` (e.g. `feature/product-reporting-filters`)
* **Engineering Enhancements**: `feature/eng-<description>` (e.g. `feature/eng-db-performance`)
* **Bug Fixes**: `fix/<description>` (e.g. `fix/milestone-modal-alignment`)

---
*SurePact Greenfield Development Team — July 22, 2026*
