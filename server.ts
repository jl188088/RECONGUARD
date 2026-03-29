import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString(), version: "RG-2.4.0" });
  });

  // Scan initiation endpoint (calls Python scanner)
  app.post("/api/scan", async (req, res) => {
    const { target, intensity, mode } = req.body;
    
    if (!target) {
      return res.status(400).json({ error: "Target is required" });
    }

    console.log(`[BACKEND] Initiating scan on ${target} with ${intensity} intensity in ${mode} mode.`);
    
    try {
      // Call the Python scanner script
      // Note: In a real app, this would be an async process that updates the database
      const { stdout, stderr } = await execPromise(`python3 scanner.py "${target}" "${intensity}"`);
      
      if (stderr) {
        console.warn(`[SCANNER WARNING]: ${stderr}`);
      }

      const result = JSON.parse(stdout);
      res.json({ 
        status: "completed", 
        scanId: `SCAN-${Date.now()}`,
        result 
      });
    } catch (error) {
      console.error(`[SCANNER ERROR]:`, error);
      res.status(500).json({ 
        error: "Scan failed", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Terminal command execution endpoint
  app.post("/api/terminal/execute", async (req, res) => {
    const { command, args } = req.body;
    
    console.log(`[TERMINAL] Executing command: ${command} with args: ${args}`);
    
    // Simulate command execution
    // In a real scenario, this could run actual system commands or specialized scripts
    let response = "";
    let level: "info" | "success" | "warn" | "error" = "info";

    switch (command.toLowerCase()) {
      case "help":
        response = "Available commands: scan, status, logs, clear, ping, whoami, version";
        break;
      case "ping":
        response = `PING ${args || "localhost"} (127.0.0.1): 56 data bytes\n64 bytes from 127.0.0.1: icmp_seq=0 ttl=64 time=0.045 ms`;
        level = "success";
        break;
      case "whoami":
        response = "RECONGUARD_OPERATOR_772";
        break;
      case "version":
        response = "RECONGUARD v2.4.0 (Build 2026.03.26)";
        break;
      case "scan":
        response = `Scan initiated on ${args || "unknown target"}. Check Penetration tab for details.`;
        level = "warn";
        break;
      default:
        response = `Command not found: ${command}`;
        level = "error";
    }

    res.json({ 
      message: response, 
      level,
      timestamp: new Date().toLocaleTimeString() 
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`RECONGUARD Full-Stack Server running on http://localhost:${PORT}`);
  });
}

startServer();
