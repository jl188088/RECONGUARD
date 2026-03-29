# RECONGUARD - Advanced Reconnaissance & Vulnerability Management

## Description
**RECONGUARD** is a proactive, AI-driven cybersecurity framework designed to **identify, evaluate, and mitigate** security weaknesses in network infrastructures and devices. By simulating the reconnaissance phase of a cyberattack, RECONGUARD allows security professionals and system administrators to discover open ports, map service architectures, and detect critical vulnerabilities *before* they can be exploited by malicious actors. 

At its core, RECONGUARD acts as an automated **"Digital Red Team,"** combining traditional network scanning techniques with the cognitive power of **Large Language Models (LLMs)** to provide deep, contextualized risk assessments and actionable defense strategies.

## Main Purpose
The primary purpose of **RECONGUARD** is to provide a comprehensive, automated, and AI-powered **Penetration Testing** and reconnaissance framework. It streamlines the process of identifying network assets, detecting open ports, mapping services, and analyzing potential vulnerabilities with high precision.

## Project Structure
```javascript
{
  "root": {
    "src/": {
      "App.tsx": "Main application logic, UI components, and state management",
      "firebase.ts": "Firebase initialization for Authentication and Firestore",
      "index.css": "Global styles, theme definitions, and Tailwind CSS imports",
      "main.tsx": "React entry point"
    },
    "backend/": {
      "engine.py": "Core scanning engine implementation",
      "network_analyzer.py": "Network topology and asset analysis",
      "penetration_tester.py": "Vulnerability exploitation simulation logic",
      "scanner.py": "Python-based reconnaissance orchestration",
      "vulnerability_db.py": "Local database for CVE references and severity scoring"
    },
    "server.ts": "Express backend server for API endpoints and terminal command execution",
    "scanner.py": "Primary Python scanning script called by the backend",
    "backend_logic.py": "Core vulnerability assessment and risk scoring logic",
    "firestore.rules": "Firebase Security Rules for data protection and access control",
    "firebase-blueprint.json": "Firestore data structure and entity definitions",
    "firebase-applet-config.json": "Firebase project credentials and configuration",
    "metadata.json": "Application metadata and required frame permissions",
    "package.json": "Project dependencies, scripts, and build configuration",
    "tsconfig.json": "TypeScript compiler configuration",
    "vite.config.ts": "Vite build tool and development server configuration",
    "index.html": "Primary HTML entry point",
    ".env.example": "Template for required environment variables",
    ".gitignore": "Paths and files to be ignored by version control"
  }
}
```

## Deployment on Railway
Railway is the recommended platform for deploying RECONGUARD due to its native support for multi-language environments (Node.js + Python).

### Steps to Deploy:
1. **Prepare your Repository:** Ensure your code is pushed to a GitHub repository.
2. **Create a New Project:** Log in to [Railway.app](https://railway.app/) and click **"New Project"**.
3. **Connect GitHub:** Select **"Deploy from GitHub repo"** and choose your RECONGUARD repository.
4. **Configure Variables:** In the Railway dashboard, go to the **Variables** tab and add:
   - `GEMINI_API_KEY`: Your Google Gemini API key.
   - `NODE_ENV`: `production`
5. **Automatic Build:** Railway's *Nixpacks* will detect both `package.json` and your Python files. It will automatically install Node.js and Python 3.
6. **Networking:** Railway will automatically assign a public URL to your app. Ensure your Express server is listening on `0.0.0.0` and the port provided by the `PORT` environment variable (Railway handles this automatically if you use `process.env.PORT || 3000`).

### Important Note:
Ensure your `package.json` has the correct `start` script:
```json
"scripts": {
  "start": "node server.ts",
  "build": "vite build"
}
```

## Features Included
- **AI-Powered Risk Analysis:** Leverages **Google Gemini 3 Flash (LLM)** to transform raw scan data into professional security reports, providing executive summaries and actionable mitigation steps.
- **Real-time Network Scanning:** Automated port discovery and service detection powered by a **Node.js/Python** backend orchestration.
- **Enhanced Interactive Terminal:** A high-performance terminal interface for executing reconnaissance commands (`scan`, `map`, `vuln`, etc.) with real-time feedback.
- **Vulnerability Registry:** A persistent, centralized database of identified security flaws stored in **Firebase Firestore** with severity scoring.
- **Network Topology Visualization:** Dynamic, interactive mapping of network assets and their relationships using **React** and **SVG**.
- **Advanced Theme Management:** Immersive system aesthetics (Cyberpunk, Matrix, Spider-Man) built with **Tailwind CSS** and **Framer Motion**.
- **Secure Data Management:** Robust user authentication and per-user data isolation provided by **Firebase Auth**.
- **Scan History Management:** Full CRUD operations for scan records, including individual deletion and bulk purging.
- **Professional Reporting:** On-demand generation of AI-powered PDF reports using **jsPDF** and **html2canvas**.

## Powered By (Tech Stack)
- **Large Language Model (LLM):** **Google Gemini 3 Flash** via `@google/genai`.
- **Frontend Framework:** **React 18** with **Vite** for lightning-fast development and optimized builds.
- **Styling & UI:** **Tailwind CSS** for utility-first styling and **Framer Motion** for high-fidelity animations.
- **Backend Server:** **Node.js (Express)** handling API requests, terminal command execution, and backend logic.
- **Database & Authentication:** **Firebase (Firestore & Auth)** for real-time synchronization and secure user sessions.
- **Scanning Logic:** **Python 3** scripts for simulated network reconnaissance and vulnerability detection.
- **Icons:** **Lucide React** for a consistent and modern iconography system.

## Recent Updates (v2.4.0)
- **Terminal Overhaul:** Improved command parsing in `server.ts` to handle arguments. Integrated the `scan` command directly with the penetration testing engine. Added a `clear` command to purge terminal logs.
- **Risk Analysis Refinement:** Streamlined the UI by removing redundant labels. Added "Purge History" and individual delete functionality to the Scan History section for better data management.
- **Settings Simplification:** Removed "Security & Privacy" and "Engine Performance" sections to focus on core configurations. Consolidated theme selection into the "Profile Configuration" area.
- **Backend Robustness:** Enhanced the terminal execution API to provide more accurate feedback and support parallel command processing.

## Setup and How to Run

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Firebase Project (for Authentication and Firestore)
- Gemini API Key (for AI features)

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   ```
4. Ensure `firebase-applet-config.json` is correctly populated with your Firebase credentials.

### Running the Application
To start the development server (both frontend and backend):
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`.

### Building for Production
```bash
npm run build
npm start
```
