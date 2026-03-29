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
      console.log(`[SCAN] Starting scan for target: ${target} (Intensity: ${intensity})`);
      
      // Try python3 first, then fallback to python
      let command = `python3 scanner.py "${target}" "${intensity}"`;
      let stdout, stderr;
      
      try {
        const execResult = await execPromise(command);
        stdout = execResult.stdout;
        stderr = execResult.stderr;
      } catch (e: any) {
        console.warn(`[SCAN] python3 failed, trying python...`);
        const execResult = await execPromise(`python scanner.py "${target}" "${intensity}"`);
        stdout = execResult.stdout;
        stderr = execResult.stderr;
      }

      if (stderr) {
        console.warn(`[SCANNER WARNING]: ${stderr}`);
      }

      const result = JSON.parse(stdout);
      console.log(`[SCAN] Scan completed successfully for ${target}`);
      res.json({ 
        status: "completed", 
        scanId: `SCAN-${Date.now()}`,
        result 
      });
    } catch (error: any) {
      console.error(`[SCANNER ERROR]:`, error);
      res.status(500).json({ 
        error: "Scan failed", 
        details: error.message,
        stdout: error.stdout,
        stderr: error.stderr
      });
    }
  });

  // Terminal command execution endpoint
  app.post("/api/terminal/execute", async (req, res) => {
    const { command: fullCommand } = req.body;
    
    // Split command and args
    const parts = fullCommand.trim().split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');
    
    console.log(`[TERMINAL] Executing command: ${command} with args: ${args}`);
    
    let response = "";
    let level: "info" | "success" | "warn" | "error" = "info";

    switch (command) {
      case "help":
        response = "Available commands: scan [target], map [--deep|--quick], vuln [--list|--export], status, logs, clear, ping [target], whoami, version, report [--ai|--pdf]";
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
      case "map":
        response = `Network topology mapping started with mode: ${args || "--quick"}.`;
        level = "info";
        break;
      case "vuln":
        response = `Vulnerability registry ${args === "--export" ? "exporting..." : "listing findings..."}`;
        level = "info";
        break;
      case "status":
        response = "Engine: ONLINE | Nodes: 12/12 ACTIVE | Latency: 42ms | Load: 24%";
        level = "success";
        break;
      case "report":
        response = `Generating ${args === "--ai" ? "AI-powered threat analysis" : "PDF security report"}...`;
        level = "info";
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

  // Engine optimization endpoint
  app.post("/api/engine/optimize", async (req, res) => {
    console.log("[BACKEND] Initiating engine optimization...");
    
    // Simulate a complex optimization process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const optimizationResult = {
      status: "success",
      timestamp: new Date().toISOString(),
      details: {
        threadsReallocated: 4,
        memoryBufferCleared: "1.2 GB",
        cachePruned: "450 MB",
        performanceGain: "+12%"
      }
    };
    
    res.json(optimizationResult);
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
