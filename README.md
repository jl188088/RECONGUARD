# RECONGUARD - Advanced Reconnaissance & Vulnerability System

https://github.com/user-attachments/assets/20d7a4ec-17d1-4373-a6a1-7eb673f5091e

https://github.com/user-attachments/assets/499d7ef1-defa-441d-8d95-103786609d5b



## Description
**RECONGUARD** is a proactive, AI-driven cybersecurity framework designed to **identify, evaluate, and mitigate** security weaknesses in network infrastructures and devices. By simulating the reconnaissance phase of a cyberattack, RECONGUARD allows security professionals and system administrators to discover open ports, map service architectures, and detect critical vulnerabilities *before* they can be exploited by malicious actors. 

At its core, RECONGUARD acts as an automated **"Digital Red Team,"** combining traditional network scanning techniques with the cognitive power of **Large Language Models (LLMs)** to provide deep, contextualized risk assessments and actionable defense strategies.

## Main Purpose
The primary purpose of **RECONGUARD** is to provide a comprehensive, automated, and AI-powered **Penetration Testing** and reconnaissance framework. It streamlines the process of identifying network assets, detecting open ports, mapping services, and analyzing potential vulnerabilities with high precision.

## Project Structure
```javascript
RECONGUARD/
│
├── .env.example              
├── .gitignore         
├── README.md                  
├── backend_logic.py            # main Python controller for backend operations
├── scanner.py                  # entry script for running scans from CLI
├── server.ts                   # node.js server handling API requests
├── index.html                
├── metadata.json               # stores app-related metadata/configuration
├── package.json                # node project dependencies and scripts
├── package-lock.json           # locks exact dependency versions
├── tsconfig.json              
├── vite.config.ts              # vite build tool configuration
├── firebase-applet-config.json # firebase app configuration settings
├── firebase-blueprint.json     # firebase project structure/template
├── firestore.rules             # security rules for Firebase database
│
├── backend/
│   ├── engine.py               # core engine coordinating scan processes
│   ├── network_analyzer.py     # analyzes network traffic and behavior
│   ├── penetration_tester.py   # simulates attacks to find vulnerabilities
│   ├── scanner.py              # handles detailed scanning logic
│   └── vulnerability_db.py     # stores and retrieves known vulnerabilities
│
├── src/
│   ├── App.tsx                 # main React component (UI logic)
│   ├── main.tsx                # app entry point rendering React app
│   ├── firebase.ts             # connects frontend to firebase services
│   └── index.css               # global styles for the application
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
- **AI-Powered Risk Analysis** -  Uses **Google Gemini 3 Flash (LLM)** to convert scan data into clear reports with summaries and mitigation steps.
- **Real-time Network Scanning** -  Automated port and service detection via **Node.js/Python** backend.
- **Interactive Terminal** -  Executes recon commands (**scan**, **map**, **vuln**) with live feedback.
- **Vulnerability Registry** -  Centralized storage in **Firebase Firestore** with severity scoring.
- **Network Visualization** - Interactive topology mapping using **React** and **SVG**.
- **Theme Management** - Cyberpunk, Matrix, and Spider-Man themes via **Tailwind CSS** and **Framer Motion**.
- **Secure Data Management** - User authentication and data isolation with **Firebase Auth**.
- **Scan History** -  Full CRUD for scan records, including bulk deletion.
- **Professional Reporting** -  Generates AI-powered PDF reports using **jsPDF** and **html2canvas**.
  
## Powered By (Tech Stack)
- **Large Language Model (LLM)** -  **Google Gemini 3 Flash** via `@google/genai`.
- **Frontend Framework** -  **React 18** with **Vite** for lightning-fast development and optimized builds.
- **Styling & UI** -  **Tailwind CSS** for utility-first styling and **Framer Motion** for high-fidelity animations.
- **Backend Server** -  **Node.js (Express)** handling API requests, terminal command execution, and backend logic.
- **Database & Authentication** -  **Firebase (Firestore & Auth)** for real-time synchronization and secure user sessions.
- **Scanning Logic** -  **Python 3** scripts for simulated network reconnaissance and vulnerability detection.
- **Icons** -  **Lucide React** for a consistent and modern iconography system.

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

##  Future Recommendations
- Real-time threat intelligence integration (live CVE/NVD data)
- Scan history with analytics and risk trend tracking
- Multi-target and subnet scanning support
- Advanced AI for attack path prediction and risk prioritization
- Containerized deployment (Docker) for scalability
- SOC-level dashboard with real-time security visualization

## 
### Author & Developer
Jayalle Pangilinan

