# RECONGUARD - Advanced Reconnaissance & Vulnerability Management

## Description
**RECONGUARD** is a proactive, AI-driven cybersecurity framework designed to **identify, evaluate, and mitigate** security weaknesses in network infrastructures and devices. By simulating the reconnaissance phase of a cyberattack, RECONGUARD allows security professionals and system administrators to discover open ports, map service architectures, and detect critical vulnerabilities *before* they can be exploited by malicious actors. 

At its core, RECONGUARD acts as an automated **"Digital Red Team,"** combining traditional network scanning techniques with the cognitive power of **Large Language Models (LLMs)** to provide deep, contextualized risk assessments and actionable defense strategies.

## Main Purpose
The primary purpose of **RECONGUARD** is to provide a comprehensive, automated, and AI-powered **Penetration Testing** and reconnaissance framework. It streamlines the process of identifying network assets, detecting open ports, mapping services, and analyzing potential vulnerabilities with high precision.

## Project Structure
```javascript
reconguard-toolkit/
│
├── app.py                  # Flask dashboard entry point
├── main.py                 # CLI version (terminal pentest tool)
├── requirements.txt        # Dependencies (Flask, colorama, etc.)
├── README.md               # Project documentation
├── .gitignore
│
├── core/                   # Core pentesting engine
│   ├── __init__.py
│   ├── scanner.py          # Port scanning logic
│   ├── analyzer.py         # Risk scoring engine
│   ├── banner.py           # Banner grabbing
│   ├── cve_db.py           # CVE mapping (local DB/mock)
│   ├── ai_report.py        # AI analysis (Gemini)
│   ├── pdf_report.py       # PDF report generator
│
├── dashboard/              # Web UI (Flask frontend)
│   ├── templates/
│   │   └── index.html      # Dashboard UI
│   ├── static/
│   │   ├── css/
│   │   └── js/
│
├── reports/                # Generated reports
│   ├── pentest_<ip>.md
│   ├── pentest_<ip>.pdf
│
├── data/                   # Optional (future upgrade)
│   ├── cve_data.json       # Local CVE dataset
│   ├── scans.db            # SQLite database (future)
│
└── docs/                   # Documentation (optional)
    ├── architecture.md
    ├── screenshots/
```

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


##  Future Recommendations
Real-time threat intelligence integration (live CVE/NVD data)
Scan history with analytics and risk trend tracking
Multi-target and subnet scanning support
Advanced AI for attack path prediction and risk prioritization
Containerized deployment (Docker) for scalability
SOC-level dashboard with real-time security visualization

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

## 
### Author & Developer
Jayalle Pangilinan

