import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { 
  LayoutDashboard, 
  Network, 
  ShieldAlert, 
  Terminal as TerminalIcon, 
  Settings as SettingsIcon, 
  Search, 
  Bell, 
  Cpu, 
  Globe, 
  Activity, 
  Zap,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Download,
  Play,
  StopCircle,
  RefreshCw,
  Maximize2,
  Minimize2,
  Target,
  Lock,
  User,
  Database,
  Eye,
  EyeOff,
  Shield,
  Diamond,
  Sun,
  Moon,
  FileText,
  Sparkles,
  X,
  LogOut,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  AreaChart, 
  Area 
} from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { GoogleGenAI } from "@google/genai";
import { 
  auth, 
  db, 
  signInWithPopup, 
  googleProvider, 
  onAuthStateChanged, 
  collection, 
  onSnapshot, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  getDocFromServer,
  getDocs,
  writeBatch,
  Timestamp,
  handleFirestoreError,
  OperationType
} from './firebase';
import type { User as FirebaseUser } from 'firebase/auth';

// --- Theme Context ---
const ThemeContext = createContext({ theme: 'theme-cyberpunk', setTheme: (t: string) => {} });
const useTheme = () => useContext(ThemeContext);

// --- Types ---
type Screen = 'dashboard' | 'network' | 'vulnerabilities' | 'terminal' | 'penetration' | 'settings' | 'about';

interface Vulnerability {
  id: string;
  target: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'mitigated' | 'ignored';
  timestamp: string;
  description: string;
  detectedAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

interface ScanHistoryEntry {
  id: string;
  target: string;
  date: string;
  status: 'completed' | 'failed' | 'interrupted';
  report: string;
  intensity: string;
  mode: string;
  findings?: {
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
  }[];
  riskScore?: number;
}

interface ScanPreset {
  id: string;
  name: string;
  target: string;
  intensity: string;
  mode: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

// --- Mock Data ---
const MOCK_VULNERABILITIES: Vulnerability[] = [
  { 
    id: 'VULN-001', 
    target: '192.168.1.45', 
    type: 'SQL Injection', 
    severity: 'critical', 
    status: 'open', 
    timestamp: '2026-03-25 14:20:01',
    description: 'Potential SQL injection vulnerability detected in the login form parameters.',
    detectedAt: '2026-03-25 14:20:01',
    updatedAt: '2026-03-25 14:20:01'
  },
  { 
    id: 'VULN-002', 
    target: 'api.production.internal', 
    type: 'Exposed API Key', 
    severity: 'high', 
    status: 'open', 
    timestamp: '2026-03-25 15:10:45',
    description: 'A production API key was found in a publicly accessible configuration file.',
    detectedAt: '2026-03-25 15:10:45',
    updatedAt: '2026-03-25 15:10:45'
  },
  { 
    id: 'VULN-003', 
    target: 'staging-db-01', 
    type: 'Weak SSH Credentials', 
    severity: 'high', 
    status: 'mitigated', 
    timestamp: '2026-03-25 16:05:12',
    description: 'Default or weak SSH credentials were being used on the staging database server.',
    detectedAt: '2026-03-25 16:05:12',
    updatedAt: '2026-03-25 16:30:00',
    resolvedAt: '2026-03-25 16:30:00'
  },
  { 
    id: 'VULN-004', 
    target: '10.0.0.12', 
    type: 'Outdated Nginx Version', 
    severity: 'medium', 
    status: 'open', 
    timestamp: '2026-03-25 16:45:30',
    description: 'The Nginx server version is outdated and contains known security vulnerabilities.',
    detectedAt: '2026-03-25 16:45:30',
    updatedAt: '2026-03-25 16:45:30'
  },
  { 
    id: 'VULN-005', 
    target: 'dev-portal.local', 
    type: 'XSS Vulnerability', 
    severity: 'medium', 
    status: 'ignored', 
    timestamp: '2026-03-25 17:12:05',
    description: 'Cross-site scripting vulnerability found in the user profile comment section.',
    detectedAt: '2026-03-25 17:12:05',
    updatedAt: '2026-03-25 17:15:00',
    resolvedAt: '2026-03-25 17:15:00'
  },
];

const MOCK_LOGS: LogEntry[] = [
  { id: '1', timestamp: '17:20:01', level: 'info', message: 'Initializing RECONGUARD engine v2.4.0...' },
  { id: '2', timestamp: '17:20:05', level: 'success', message: 'Connection established with global node network.' },
  { id: '3', timestamp: '17:21:12', level: 'info', message: 'Starting deep scan on subnet 192.168.1.0/24' },
  { id: '4', timestamp: '17:22:45', level: 'warn', message: 'Potential firewall detected at 192.168.1.1. Bypassing...' },
  { id: '5', timestamp: '17:24:30', level: 'error', message: 'Target 192.168.1.10 connection timed out.' },
  { id: '6', timestamp: '17:25:15', level: 'success', message: 'Found 12 open ports on 192.168.1.45' },
];

// --- Components ---

const Login = ({ onLogin }: { onLogin: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Initialize user profile in Firestore if it doesn't exist
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: 'user', // Default role
        lastLogin: new Date().toISOString()
      }, { merge: true });
      
      onLogin();
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <StarGalaxy />
      <SpiderWeb />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel max-w-md w-full p-8 text-center relative z-10"
      >
        <Logo size={64} className="mx-auto mb-6 text-primary" />
        <h1 className="text-3xl font-headline font-bold mb-2 tracking-tighter">RECONGUARD</h1>
        <p className="text-on-surface-variant mb-8 font-body">Advanced Reconnaissance & Vulnerability Management</p>
        
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm flex items-center gap-3">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}
        
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-primary text-on-primary font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw size={20} className="animate-spin" />
          ) : (
            <Globe size={20} />
          )}
          {loading ? "Authenticating..." : "Sign in with Google"}
        </button>
        
        <p className="mt-8 text-[10px] text-on-surface-variant uppercase tracking-widest opacity-50">
          Secure Access Required • Authorized Personnel Only
        </p>
      </motion.div>
    </div>
  );
};

const Logo = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
    <Shield size={size} className="text-inherit" />
    <div className="absolute inset-0 flex items-center justify-center">
      <Diamond size={size * 0.5} className="text-inherit" />
    </div>
    <div className="absolute inset-0 flex items-center justify-center mt-[10%]">
      <div className="w-[12%] h-[12%] rounded-full bg-background border border-inherit" />
      <div className="absolute top-[55%] w-[8%] h-[15%] bg-background border-x border-b border-inherit rounded-b-sm" />
    </div>
  </div>
);

const SpiderWeb = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40 z-0 mix-blend-screen">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(241,30,34,0.2),transparent_60%)]" />
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,rgba(26,78,138,0.1),transparent_50%)]" />
      
      <motion.svg 
        viewBox="0 0 1000 1000" 
        className="absolute -top-20 -left-20 w-[600px] h-[600px] text-primary"
        animate={{ 
          rotate: [0, 5, 0],
          scale: [1, 1.05, 1],
          x: [0, 10, 0],
          y: [0, 5, 0]
        }}
        transition={{ 
          duration: 10, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        <circle cx="500" cy="500" r="10" fill="currentColor" />
        {[...Array(12)].map((_, i) => (
          <line 
            key={`radial-${i}`}
            x1="500" y1="500" 
            x2={500 + 500 * Math.cos((i * 30 * Math.PI) / 180)} 
            y2={500 + 500 * Math.sin((i * 30 * Math.PI) / 180)} 
            stroke="currentColor" 
            strokeWidth="1" 
          />
        ))}
        {[...Array(8)].map((_, i) => (
          <motion.path 
            key={`ring-${i}`}
            d={`M ${500 + (i + 1) * 60} 500 
               A ${(i + 1) * 60} ${(i + 1) * 60} 0 0 1 ${500 + (i + 1) * 60 * Math.cos((30 * Math.PI) / 180)} ${500 + (i + 1) * 60 * Math.sin((30 * Math.PI) / 180)}
               A ${(i + 1) * 60} ${(i + 1) * 60} 0 0 1 ${500 + (i + 1) * 60 * Math.cos((60 * Math.PI) / 180)} ${500 + (i + 1) * 60 * Math.sin((60 * Math.PI) / 180)}
               A ${(i + 1) * 60} ${(i + 1) * 60} 0 0 1 ${500 + (i + 1) * 60 * Math.cos((90 * Math.PI) / 180)} ${500 + (i + 1) * 60 * Math.sin((90 * Math.PI) / 180)}
               A ${(i + 1) * 60} ${(i + 1) * 60} 0 0 1 ${500 + (i + 1) * 60 * Math.cos((120 * Math.PI) / 180)} ${500 + (i + 1) * 60 * Math.sin((120 * Math.PI) / 180)}
               A ${(i + 1) * 60} ${(i + 1) * 60} 0 0 1 ${500 + (i + 1) * 60 * Math.cos((150 * Math.PI) / 180)} ${500 + (i + 1) * 60 * Math.sin((150 * Math.PI) / 180)}
               A ${(i + 1) * 60} ${(i + 1) * 60} 0 0 1 ${500 + (i + 1) * 60 * Math.cos((180 * Math.PI) / 180)} ${500 + (i + 1) * 60 * Math.sin((180 * Math.PI) / 180)}
               A ${(i + 1) * 60} ${(i + 1) * 60} 0 0 1 ${500 + (i + 1) * 60 * Math.cos((210 * Math.PI) / 180)} ${500 + (i + 1) * 60 * Math.sin((210 * Math.PI) / 180)}
               A ${(i + 1) * 60} ${(i + 1) * 60} 0 0 1 ${500 + (i + 1) * 60 * Math.cos((240 * Math.PI) / 180)} ${500 + (i + 1) * 60 * Math.sin((240 * Math.PI) / 180)}
               A ${(i + 1) * 60} ${(i + 1) * 60} 0 0 1 ${500 + (i + 1) * 60 * Math.cos((270 * Math.PI) / 180)} ${500 + (i + 1) * 60 * Math.sin((270 * Math.PI) / 180)}
               A ${(i + 1) * 60} ${(i + 1) * 60} 0 0 1 ${500 + (i + 1) * 60 * Math.cos((300 * Math.PI) / 180)} ${500 + (i + 1) * 60 * Math.sin((300 * Math.PI) / 180)}
               A ${(i + 1) * 60} ${(i + 1) * 60} 0 0 1 ${500 + (i + 1) * 60 * Math.cos((330 * Math.PI) / 180)} ${500 + (i + 1) * 60 * Math.sin((330 * Math.PI) / 180)}
               Z`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3 + i, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </motion.svg>

      <motion.svg 
        viewBox="0 0 1000 1000" 
        className="absolute -bottom-40 -right-40 w-[800px] h-[800px] text-secondary"
        animate={{ 
          rotate: [0, -3, 0],
          scale: [1, 1.02, 1]
        }}
        transition={{ 
          duration: 15, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        <circle cx="500" cy="500" r="10" fill="currentColor" />
        {[...Array(12)].map((_, i) => (
          <line 
            key={`radial-2-${i}`}
            x1="500" y1="500" 
            x2={500 + 500 * Math.cos((i * 30 * Math.PI) / 180)} 
            y2={500 + 500 * Math.sin((i * 30 * Math.PI) / 180)} 
            stroke="currentColor" 
            strokeWidth="1" 
          />
        ))}
        {[...Array(10)].map((_, i) => (
          <motion.path 
            key={`ring-2-${i}`}
            d={`M ${500 + (i + i) * 50} 500 
               A ${(i + 1) * 50} ${(i + 1) * 50} 0 0 1 ${500 + (i + 1) * 50 * Math.cos((30 * Math.PI) / 180)} ${500 + (i + 1) * 50 * Math.sin((30 * Math.PI) / 180)}
               A ${(i + 1) * 50} ${(i + 1) * 50} 0 0 1 ${500 + (i + 1) * 50 * Math.cos((60 * Math.PI) / 180)} ${500 + (i + 1) * 50 * Math.sin((60 * Math.PI) / 180)}
               A ${(i + 1) * 50} ${(i + 1) * 50} 0 0 1 ${500 + (i + 1) * 50 * Math.cos((90 * Math.PI) / 180)} ${500 + (i + 1) * 50 * Math.sin((90 * Math.PI) / 180)}
               A ${(i + 1) * 50} ${(i + 1) * 50} 0 0 1 ${500 + (i + 1) * 50 * Math.cos((120 * Math.PI) / 180)} ${500 + (i + 1) * 50 * Math.sin((120 * Math.PI) / 180)}
               A ${(i + 1) * 50} ${(i + 1) * 50} 0 0 1 ${500 + (i + 1) * 50 * Math.cos((150 * Math.PI) / 180)} ${500 + (i + 1) * 50 * Math.sin((150 * Math.PI) / 180)}
               A ${(i + 1) * 50} ${(i + 1) * 50} 0 0 1 ${500 + (i + 1) * 50 * Math.cos((180 * Math.PI) / 180)} ${500 + (i + 1) * 50 * Math.sin((180 * Math.PI) / 180)}
               A ${(i + 1) * 50} ${(i + 1) * 50} 0 0 1 ${500 + (i + 1) * 50 * Math.cos((210 * Math.PI) / 180)} ${500 + (i + 1) * 50 * Math.sin((210 * Math.PI) / 180)}
               A ${(i + 1) * 50} ${(i + 1) * 50} 0 0 1 ${500 + (i + 1) * 50 * Math.cos((240 * Math.PI) / 180)} ${500 + (i + 1) * 50 * Math.sin((240 * Math.PI) / 180)}
               A ${(i + 1) * 50} ${(i + 1) * 50} 0 0 1 ${500 + (i + 1) * 50 * Math.cos((270 * Math.PI) / 180)} ${500 + (i + 1) * 50 * Math.sin((270 * Math.PI) / 180)}
               A ${(i + 1) * 50} ${(i + 1) * 50} 0 0 1 ${500 + (i + 1) * 50 * Math.cos((300 * Math.PI) / 180)} ${500 + (i + 1) * 50 * Math.sin((300 * Math.PI) / 180)}
               A ${(i + 1) * 50} ${(i + 1) * 50} 0 0 1 ${500 + (i + 1) * 50 * Math.cos((330 * Math.PI) / 180)} ${500 + (i + 1) * 50 * Math.sin((330 * Math.PI) / 180)}
               Z`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            animate={{ opacity: [0.1, 0.4, 0.1] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </motion.svg>
    </div>
  );
};

const MatrixRain = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%\"'#&_(),.;:?!\\|{}<>[]^~";
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];

    for (let i = 0; i < columns; i++) {
      drops[i] = 1;
    }

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#00ff41";
      ctx.font = fontSize + "px monospace";

      for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none opacity-30 z-0" />;
};

const ToxicGas = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-50 z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-[100px]"
          style={{
            width: Math.random() * 500 + 300,
            height: Math.random() * 500 + 300,
            left: `${Math.random() * 120 - 10}%`,
            top: `${Math.random() * 120 - 10}%`,
            background: i % 3 === 0 ? 'rgba(0, 255, 127, 0.15)' : i % 3 === 1 ? 'rgba(173, 255, 47, 0.1)' : 'rgba(0, 128, 0, 0.1)',
          }}
          animate={{
            x: [0, Math.random() * 200 - 100, 0],
            y: [0, Math.random() * 200 - 100, 0],
            rotate: [0, 360],
            scale: [1, 1.3, 0.9, 1.1, 1],
            opacity: [0.2, 0.5, 0.3, 0.6, 0.2],
          }}
          transition={{
            duration: 15 + Math.random() * 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-primary/20" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 mix-blend-overlay" />
    </div>
  );
};

const StarGalaxy = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-[#00020a]">
      {/* Deep Space Base Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,20,80,0.4)_0%,transparent_100%)]" />
      
      {/* Distant Star Field (Static-ish) */}
      <div className="absolute inset-0 opacity-30">
        {[...Array(300)].map((_, i) => (
          <div
            key={`static-star-${i}`}
            className="absolute bg-white rounded-full"
            style={{
              width: Math.random() * 1 + 0.5,
              height: Math.random() * 1 + 0.5,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.2,
            }}
          />
        ))}
      </div>

      {/* Twinkling Stars */}
      {[...Array(150)].map((_, i) => (
        <motion.div
          key={`twinkle-star-${i}`}
          className="absolute bg-white rounded-full"
          style={{
            width: Math.random() * 1.5 + 0.5,
            height: Math.random() * 1.5 + 0.5,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0.2, 1, 0.2],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 1.5 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}

      {/* Bright Blue Stars (Star Clusters) */}
      {[...Array(40)].map((_, i) => (
        <motion.div
          key={`bright-star-${i}`}
          className="absolute bg-cyan-200 rounded-full shadow-[0_0_10px_rgba(0,255,255,0.6)]"
          style={{
            width: Math.random() * 2 + 1,
            height: Math.random() * 2 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0.4, 1, 0.4],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}

      {/* Main Blue Nebulae (Vibrant Blue from Image) */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`nebula-blue-${i}`}
          className="absolute rounded-full blur-[120px] mix-blend-screen"
          style={{
            width: Math.random() * 800 + 500,
            height: Math.random() * 600 + 400,
            background: `radial-gradient(circle, rgba(0, 80, 255, ${0.15 + Math.random() * 0.1}) 0%, transparent 70%)`,
            left: `${Math.random() * 120 - 20}%`,
            top: `${Math.random() * 120 - 20}%`,
          }}
          animate={{
            scale: [1, 1.15, 0.95, 1.05, 1],
            opacity: [0.3, 0.6, 0.4, 0.7, 0.3],
            rotate: [0, i % 2 === 0 ? 30 : -30],
          }}
          transition={{
            duration: 20 + Math.random() * 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Magenta/Pink Highlights (From Image) */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`nebula-magenta-${i}`}
          className="absolute rounded-full blur-[100px] mix-blend-screen"
          style={{
            width: Math.random() * 400 + 300,
            height: Math.random() * 400 + 300,
            background: `radial-gradient(circle, rgba(255, 0, 150, ${0.08 + Math.random() * 0.05}) 0%, transparent 70%)`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            scale: [0.8, 1.2, 0.8],
            opacity: [0.1, 0.3, 0.1],
            x: [0, Math.random() * 50 - 25, 0],
            y: [0, Math.random() * 50 - 25, 0],
          }}
          transition={{
            duration: 15 + Math.random() * 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Cyan/Teal Highlights */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`nebula-cyan-${i}`}
          className="absolute rounded-full blur-[90px] mix-blend-screen"
          style={{
            width: Math.random() * 500 + 300,
            height: Math.random() * 500 + 300,
            background: `radial-gradient(circle, rgba(0, 255, 255, 0.05) 0%, transparent 70%)`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Shooting Stars */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`shooting-star-${i}`}
          className="absolute h-px w-[150px] bg-gradient-to-r from-transparent via-blue-200 to-transparent rotate-[-35deg]"
          initial={{ x: '-20%', y: '-20%', opacity: 0 }}
          animate={{
            x: ['0%', '150%'],
            y: ['0%', '100%'],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            repeatDelay: 8 + Math.random() * 15,
            delay: i * 5,
            ease: "linear",
          }}
        />
      ))}

      {/* Central Galaxy Core (Brighter Area) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle,rgba(0,120,255,0.08)_0%,transparent_60%)] pointer-events-none" />
    </div>
  );
};

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing core modules...');
  
  const statusMessages = [
    'Initializing core modules...',
    'Establishing secure handshake...',
    'Loading global node network...',
    'Synchronizing threat intelligence...',
    'Bypassing local firewalls...',
    'Reconnaissance engine ready.'
  ];

  useEffect(() => {
    const duration = 3000; // 3 seconds
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const newProgress = Math.min((currentStep / steps) * 100, 100);
      setProgress(newProgress);

      const messageIndex = Math.floor((newProgress / 100) * (statusMessages.length - 1));
      setStatus(statusMessages[messageIndex]);

      if (newProgress >= 100) {
        clearInterval(timer);
        setTimeout(onComplete, 500);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-primary/20 aurora-blur rounded-full pointer-events-none" />
      <div className="scanline-overlay" />

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="w-24 h-24 bg-primary rounded-2xl flex items-center justify-center neon-glow-primary mb-8">
          <Logo size={48} className="text-surface" />
        </div>
        
        <h1 className="text-5xl font-headline font-bold tracking-[0.2em] text-primary mb-2">RECONGUARD</h1>
        <p className="text-on-surface-variant font-label tracking-[0.5em] uppercase text-sm mb-12 opacity-50">Advanced Reconnaissance System</p>

        <div className="w-80 space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-mono text-primary uppercase tracking-widest">{status}</span>
            <span className="text-xs font-mono text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="h-1 w-full bg-surface-variant rounded-full overflow-hidden border border-outline-variant/20">
            <motion.div 
              className="h-full bg-primary neon-glow-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-12 flex gap-8">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-on-surface-variant uppercase opacity-30">Version</span>
            <span className="text-xs font-mono text-on-surface-variant">2.4.0-STABLE</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-on-surface-variant uppercase opacity-30">Node</span>
            <span className="text-xs font-mono text-on-surface-variant">RG-772-X</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-on-surface-variant uppercase opacity-30">Status</span>
            <span className="text-xs font-mono text-tertiary">ENCRYPTED</span>
          </div>
        </div>
      </motion.div>

      {/* Decorative elements */}
      <div className="absolute bottom-12 left-12 font-mono text-[10px] text-on-surface-variant opacity-20 space-y-1">
        <div>[SYSTEM] KERNEL_LOAD_OK</div>
        <div>[SYSTEM] NETWORK_STACK_INIT</div>
        <div>[SYSTEM] CRYPTO_MODULE_ACTIVE</div>
      </div>
      <div className="absolute top-12 right-12 font-mono text-[10px] text-on-surface-variant opacity-20 text-right space-y-1">
        <div>LATENCY: 12ms</div>
        <div>UPTIME: 99.99%</div>
        <div>SECURE_BOOT: ENABLED</div>
      </div>
    </motion.div>
  );
};

const Sidebar = ({ activeScreen, setScreen }: { activeScreen: Screen, setScreen: (s: Screen) => void }) => {
  const { theme } = useTheme();
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'network', icon: Network, label: 'Network Map' },
    { id: 'penetration', icon: Target, label: 'Risk Analysis' },
    { id: 'vulnerabilities', icon: ShieldAlert, label: 'Vulnerabilities' },
    { id: 'terminal', icon: TerminalIcon, label: 'Terminal' },
    { id: 'about', icon: User, label: 'About Developer' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <div className="w-64 border-r border-outline-variant/20 flex flex-col h-full glass-panel z-10">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center neon-glow-primary">
          <Logo size={24} className="text-surface" />
        </div>
        <h1 className="text-xl font-headline font-bold tracking-wider text-primary">RECONGUARD</h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setScreen(item.id as Screen)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
              activeScreen === item.id 
                ? 'bg-primary/10 text-primary border border-primary/20' 
                : 'text-on-surface-variant hover:bg-surface-bright hover:text-on-surface'
            }`}
          >
            <item.icon size={20} className={activeScreen === item.id ? 'text-primary' : 'group-hover:text-primary'} />
            <span className="font-label font-medium">{item.label}</span>
            {activeScreen === item.id && (
              <motion.div 
                layoutId="active-pill"
                className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
              />
            )}
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-outline-variant/20 space-y-4">
        <div className="p-4 rounded-xl bg-surface-variant/50 border border-outline-variant/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            <span className="text-xs font-label text-tertiary uppercase tracking-widest">System Online</span>
          </div>
          <p className="text-[10px] text-on-surface-variant font-mono">NODE-ID: RG-772-X</p>
        </div>
      </div>
    </div>
  );
};

const Header = () => {
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);

  const results = [
    { type: 'Asset', name: 'WEB-SRV-01', ip: '192.168.1.45' },
    { type: 'Vulnerability', name: 'SQL Injection', target: '192.168.1.45' },
    { type: 'Node', name: 'DB-CLUSTER-A', ip: '10.0.0.5' },
  ].filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || (r.ip && r.ip.includes(search)));

  return (
    <header className="h-20 border-bottom border-outline-variant/20 flex items-center justify-between px-8 glass-panel !bg-surface z-10">
      <div className="flex items-center gap-6 flex-1">
        <div className="relative w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
          <input 
            type="text" 
            placeholder="Search network assets, IPs, vulnerabilities..." 
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowResults(e.target.value.length > 0);
            }}
            onFocus={() => setShowResults(search.length > 0)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            className="w-full bg-surface-variant/50 border border-outline-variant/20 rounded-full py-2.5 pl-12 pr-6 text-sm focus:outline-none focus:border-primary/50 transition-colors"
          />
          
          <AnimatePresence>
            {showResults && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 w-full mt-2 glass-panel rounded-2xl border-outline-variant/20 shadow-2xl overflow-hidden z-50"
              >
                <div className="p-4 border-b border-outline-variant/10">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Quick Search Results</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {results.length > 0 ? results.map((res, i) => (
                    <div key={i} className="p-4 hover:bg-primary/5 cursor-pointer border-b border-outline-variant/5 last:border-none flex items-center justify-between group">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-on-surface-variant uppercase">{res.type}</span>
                          <h5 className="text-sm font-bold group-hover:text-primary transition-colors">{res.name}</h5>
                        </div>
                        <p className="text-xs text-on-surface-variant">{res.ip || res.target}</p>
                      </div>
                      <ChevronRight size={16} className="text-on-surface-variant group-hover:text-primary transition-colors" />
                    </div>
                  )) : (
                    <div className="p-8 text-center opacity-30 text-xs">No results found for "{search}"</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-4 py-2 bg-surface-variant/50 rounded-full border border-outline-variant/20">
          <Globe size={16} className="text-tertiary" />
          <span className="text-xs font-label text-on-surface-variant">US-EAST-1</span>
        </div>
      </div>
    </header>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  icon: any;
  color: string;
  trend: string;
  chartType: 'bar' | 'pie' | 'line' | 'area';
}

const StatCard = ({ label, value, icon: Icon, color, trend, chartType }: any) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Mock data for charts
  const barData = [
    { name: 'Mon', val: 40 },
    { name: 'Tue', val: 30 },
    { name: 'Wed', val: 60 },
    { name: 'Thu', val: 45 },
    { name: 'Fri', val: 90 },
    { name: 'Sat', val: 55 },
    { name: 'Sun', val: 70 },
  ];

  const pieData = [
    { name: 'Endpoints', value: 400 },
    { name: 'Servers', value: 300 },
    { name: 'Cloud', value: 300 },
    { name: 'IoT', value: 200 },
  ];

  const lineData = [
    { name: '00:00', val: 10 },
    { name: '04:00', val: 25 },
    { name: '08:00', val: 45 },
    { name: '12:00', val: 30 },
    { name: '16:00', val: 55 },
    { name: '20:00', val: 40 },
    { name: '23:59', val: 20 },
  ];

  const COLORS = ['#ff8aa9', '#d674ff', '#8ff5ff', '#ff6e84'];

  return (
    <motion.div 
      layout
      whileHover={{ y: -4, scale: 1.01 }}
      className={`glass-panel p-6 rounded-2xl relative overflow-hidden group transition-all duration-500 ${isExpanded ? 'col-span-1 md:col-span-2 lg:col-span-2' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-label text-on-surface-variant uppercase tracking-wider">{label}</p>
          <h3 className="text-3xl font-headline font-bold mt-2">{value}</h3>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg bg-surface-variant/50 text-on-surface-variant hover:text-primary transition-colors"
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <div className={`p-3 rounded-xl bg-surface-variant/50 ${color}`}>
            <Icon size={24} />
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex items-center gap-2">
        <span className={`text-xs font-mono ${trend.startsWith('+') ? 'text-tertiary' : trend.startsWith('-') ? 'text-error' : 'text-on-surface-variant'}`}>
          {trend}
        </span>
        <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-label">vs last 24h</span>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 200 }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#474752" vertical={false} />
                  <XAxis dataKey="name" stroke="#abaab7" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#abaab7" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#242532', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                    itemStyle={{ color: '#ff8aa9' }}
                  />
                  <Bar 
                    dataKey="val" 
                    fill="#ff8aa9" 
                    radius={[4, 4, 0, 0]} 
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                </BarChart>
              ) : chartType === 'pie' ? (
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#242532', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                  />
                </PieChart>
              ) : chartType === 'line' ? (
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#474752" vertical={false} />
                  <XAxis dataKey="name" stroke="#abaab7" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#abaab7" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#242532', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                  />
                  <Line type="monotone" dataKey="val" stroke="#8ff5ff" strokeWidth={2} dot={{ fill: '#8ff5ff', r: 4 }} />
                </LineChart>
              ) : (
                <AreaChart data={lineData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d674ff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#d674ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#474752" vertical={false} />
                  <XAxis dataKey="name" stroke="#abaab7" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#abaab7" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#242532', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                  />
                  <Area type="monotone" dataKey="val" stroke="#d674ff" fillOpacity={1} fill="url(#colorVal)" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon size={80} />
      </div>
    </motion.div>
  );
};

const Dashboard = ({ onNavigate, onNewScan, vulnerabilities, scanHistory }: { 
  onNavigate: (screen: Screen) => void, 
  onNewScan: () => void,
  vulnerabilities: Vulnerability[],
  scanHistory: ScanHistoryEntry[]
}) => {
  const stats = [
    { label: 'Total Assets', value: '1,284', icon: Cpu, color: 'text-tertiary', trend: '+12%', chartType: 'pie' as const },
    { label: 'Active Scans', value: scanHistory.filter(s => s.status === 'completed').length.toString(), icon: Activity, color: 'text-primary', trend: 'Stable', chartType: 'line' as const },
    { label: 'Vulnerabilities', value: vulnerabilities.length.toString(), icon: ShieldAlert, color: 'text-error', trend: '-5%', chartType: 'bar' as const },
    { label: 'Network Load', value: '24%', icon: Zap, color: 'text-secondary', trend: '+2%', chartType: 'area' as const },
  ];

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-headline font-bold text-on-surface">System Overview</h2>
          <p className="text-on-surface-variant mt-1">Real-time reconnaissance and threat intelligence.</p>
        </div>
        <button 
          onClick={onNewScan}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-surface font-headline font-bold rounded-xl hover:opacity-90 transition-opacity neon-glow-primary"
        >
          <Play size={18} />
          New Scan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard 
            key={stat.label} 
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            trend={stat.trend}
            chartType={stat.chartType}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-headline font-bold">Network Activity</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-xs font-label bg-surface-variant rounded-md text-on-surface-variant hover:text-on-surface">1H</button>
              <button className="px-3 py-1 text-xs font-label bg-primary/20 rounded-md text-primary">24H</button>
              <button className="px-3 py-1 text-xs font-label bg-surface-variant rounded-md text-on-surface-variant hover:text-on-surface">7D</button>
            </div>
          </div>
          <div className="h-64 flex items-end gap-2 px-2">
            {[40, 60, 45, 90, 65, 30, 85, 50, 70, 40, 55, 80, 60, 45, 95, 70, 50, 65, 80, 40].map((h, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                className="flex-1 bg-gradient-to-t from-primary/20 to-primary rounded-t-sm relative group"
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-bright px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-outline-variant/20">
                  {h}MB/s
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between mt-4 px-2">
            <span className="text-[10px] font-mono text-on-surface-variant">00:00</span>
            <span className="text-[10px] font-mono text-on-surface-variant">06:00</span>
            <span className="text-[10px] font-mono text-on-surface-variant">12:00</span>
            <span className="text-[10px] font-mono text-on-surface-variant">18:00</span>
            <span className="text-[10px] font-mono text-on-surface-variant">23:59</span>
          </div>
        </div>

        <div className="glass-panel !bg-surface/10 rounded-2xl p-6">
          <h3 className="text-xl font-headline font-bold mb-6">Recent Alerts</h3>
          <div className="space-y-4">
            {MOCK_VULNERABILITIES.slice(0, 4).map((vuln) => (
              <div 
                key={vuln.id} 
                onClick={() => onNavigate('vulnerabilities')}
                className="flex gap-4 p-3 rounded-xl hover:bg-surface-variant/30 transition-colors cursor-pointer border border-transparent hover:border-outline-variant/20"
              >
                <div className={`mt-1 p-2 rounded-lg ${
                  vuln.severity === 'critical' ? 'bg-error/10 text-error' : 
                  vuln.severity === 'high' ? 'bg-primary/10 text-primary' : 'bg-tertiary/10 text-tertiary'
                }`}>
                  <AlertTriangle size={16} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold">{vuln.type}</h4>
                    <span className="text-[10px] font-mono text-on-surface-variant">{vuln.timestamp.split(' ')[1]}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">{vuln.target}</p>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => onNavigate('vulnerabilities')}
            className="w-full mt-6 py-3 text-xs font-label text-primary hover:bg-primary/5 rounded-xl transition-colors border border-primary/20"
          >
            View All Alerts
          </button>
        </div>
      </div>
    </div>
  );
};

const NetworkMap = ({ onScan }: { onScan: (target: string) => void }) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const nodes = [
    { x: '25%', y: '25%', label: 'WEB-SRV-01', ip: '192.168.1.45', ports: '80, 443, 22', vulns: 3, color: 'text-tertiary', icon: Globe },
    { x: '75%', y: '25%', label: 'DB-CLUSTER-A', ip: '10.0.0.5', ports: '5432, 6379', vulns: 1, color: 'text-secondary', icon: Cpu },
    { x: '25%', y: '75%', label: 'IOT-BRIDGE', ip: '192.168.1.12', ports: '1883, 8883', vulns: 5, color: 'text-primary', icon: Zap },
    { x: '75%', y: '75%', label: 'AUTH-NODE', ip: '10.0.0.12', ports: '389, 636', vulns: 0, color: 'text-tertiary', icon: ShieldAlert },
    { x: '15%', y: '50%', label: 'VPN-CON', ip: '172.16.0.1', ports: '1194, 500', vulns: 2, color: 'text-on-surface-variant', icon: Network },
    { x: '85%', y: '50%', label: 'LOG-AGG', ip: '10.0.0.25', ports: '514, 9200', vulns: 1, color: 'text-on-surface-variant', icon: Activity },
  ];

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-headline font-bold text-on-surface">Network Topology</h2>
          <p className="text-on-surface-variant mt-1">Visualizing asset relationships and traffic flow.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-variant/50 rounded-xl border border-outline-variant/20">
            <Filter size={16} className="text-on-surface-variant" />
            <span className="text-sm font-label">Filter</span>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-surface-variant/50 rounded-xl border border-outline-variant/20 hover:bg-surface-bright transition-colors">
            <RefreshCw size={16} className="text-on-surface-variant" />
            <span className="text-sm font-label">Refresh</span>
          </button>
        </div>
      </div>

      <div className="flex-1 glass-panel rounded-3xl relative overflow-hidden flex items-center justify-center">
        {/* Simulated Network Graph */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #757480 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <div className="relative w-full h-full">
          {/* Central Hub */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-primary/20 rounded-full border-2 border-primary flex items-center justify-center neon-glow-primary z-10"
          >
            <Globe size={40} className="text-primary" />
            <div className="absolute -bottom-8 whitespace-nowrap text-xs font-bold font-mono text-primary">CORE-GATEWAY-01</div>
          </motion.div>

          {/* Nodes */}
          {nodes.map((node, i) => (
            <React.Fragment key={node.label}>
              {/* Connection Line */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <motion.line 
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.2 }}
                  transition={{ delay: i * 0.2 + 0.5, duration: 1 }}
                  x1="50%" y1="50%" x2={node.x} y2={node.y} 
                  stroke="currentColor" strokeWidth="1" className={node.color} 
                />
              </svg>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 + 0.3 }}
                style={{ left: node.x, top: node.y }}
                onMouseEnter={() => setHoveredNode(node.label)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => setSelectedNode(node)}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 glass-panel rounded-xl border-outline-variant/40 flex items-center justify-center group cursor-pointer hover:border-primary/50 transition-all z-20"
              >
                <node.icon size={20} className={node.color} />
                <div className="absolute -bottom-6 whitespace-nowrap text-[10px] font-mono text-on-surface-variant group-hover:text-on-surface transition-colors">{node.label}</div>
                
                <AnimatePresence>
                  {hoveredNode === node.label && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      className="absolute bottom-full mb-4 w-48 glass-panel p-4 rounded-xl border-primary/20 shadow-2xl pointer-events-none z-50"
                    >
                      <h4 className="text-xs font-bold text-primary mb-2">{node.label}</h4>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-on-surface-variant">IP:</span>
                          <span className="font-mono text-on-surface">{node.ip}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-on-surface-variant">Ports:</span>
                          <span className="font-mono text-on-surface">{node.ports}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-on-surface-variant">Vulns:</span>
                          <span className={`font-mono font-bold ${node.vulns > 0 ? 'text-error' : 'text-tertiary'}`}>{node.vulns}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence>
          {selectedNode && (
            <motion.div 
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="absolute top-0 right-0 h-full w-80 glass-panel border-l border-outline-variant/20 p-8 z-30 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-headline font-bold">Node Details</h3>
                <button onClick={() => setSelectedNode(null)} className="text-on-surface-variant hover:text-primary">
                  <EyeOff size={20} />
                </button>
              </div>

              <div className="space-y-8">
                <div className="flex flex-col items-center">
                  <div className={`w-20 h-20 rounded-2xl bg-surface-variant/50 flex items-center justify-center mb-4 border border-outline-variant/20 ${selectedNode.color}`}>
                    <selectedNode.icon size={40} />
                  </div>
                  <h4 className="text-lg font-bold">{selectedNode.label}</h4>
                  <p className="text-xs font-mono text-on-surface-variant">{selectedNode.ip}</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-surface-variant/30 border border-outline-variant/10">
                    <span className="block text-[10px] font-label text-on-surface-variant uppercase mb-2">System Status</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                      <span className="text-sm font-bold">Operational</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-variant/30 border border-outline-variant/10">
                    <span className="block text-[10px] font-label text-on-surface-variant uppercase mb-2">Open Ports</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedNode.ports.split(', ').map((p: string) => (
                        <span key={p} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono">{p}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={() => onScan(selectedNode.ip)}
                    className="w-full py-3 bg-primary text-surface font-headline font-bold rounded-xl hover:opacity-90 transition-opacity neon-glow-primary flex items-center justify-center gap-2"
                  >
                    <Target size={16} />
                    Targeted Scan
                  </button>
                  <button className="w-full py-3 bg-surface-variant/50 text-on-surface font-headline font-bold rounded-xl hover:bg-surface-bright transition-colors border border-outline-variant/20">
                    View Full Logs
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <div className="absolute bottom-8 left-8 glass-panel p-4 rounded-xl border-outline-variant/20 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-xs font-label text-on-surface-variant">Critical Asset</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-tertiary" />
            <span className="text-xs font-label text-on-surface-variant">Production</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-secondary" />
            <span className="text-xs font-label text-on-surface-variant">Database</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Vulnerabilities = ({ vulnerabilities }: { vulnerabilities: Vulnerability[] }) => {
  const [hoveredVuln, setHoveredVuln] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVulnerabilities = vulnerabilities.filter(v => {
    const matchesSeverity = filterSeverity === 'all' || v.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || v.status === filterStatus;
    const matchesSearch = 
      v.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSeverity && matchesStatus && matchesSearch;
  });

  const severityStats = {
    critical: { percent: (vulnerabilities.filter(v => v.severity === 'critical').length / (vulnerabilities.length || 1)) * 100, count: vulnerabilities.filter(v => v.severity === 'critical').length },
    high: { percent: (vulnerabilities.filter(v => v.severity === 'high').length / (vulnerabilities.length || 1)) * 100, count: vulnerabilities.filter(v => v.severity === 'high').length },
    medium: { percent: (vulnerabilities.filter(v => v.severity === 'medium').length / (vulnerabilities.length || 1)) * 100, count: vulnerabilities.filter(v => v.severity === 'medium').length },
    low: { percent: (vulnerabilities.filter(v => v.severity === 'low').length / (vulnerabilities.length || 1)) * 100, count: vulnerabilities.filter(v => v.severity === 'low').length },
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-headline font-bold text-on-surface">Vulnerability Registry</h2>
          <p className="text-on-surface-variant mt-1">Identified security flaws and mitigation status.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-variant/50 rounded-xl border border-outline-variant/20">
            <Search size={16} className="text-on-surface-variant" />
            <input 
              type="text" 
              placeholder="Search vulnerabilities..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-label w-48"
            />
          </div>
          <select 
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-surface-variant/50 border border-outline-variant/20 rounded-xl px-4 py-2 text-sm font-label outline-none"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-surface-variant/50 border border-outline-variant/20 rounded-xl px-4 py-2 text-sm font-label outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="mitigated">Mitigated</option>
            <option value="ignored">Ignored</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-surface-variant/50 rounded-xl border border-outline-variant/20 hover:bg-surface-bright transition-colors">
            <Download size={16} />
            <span className="text-sm font-label">Export Report</span>
          </button>
        </div>
      </div>

      <div className="flex-1 glass-panel rounded-3xl overflow-hidden flex flex-col">
        <div className="grid grid-cols-6 gap-4 p-6 border-b border-outline-variant/20 bg-surface-variant/20">
          <div className="text-xs font-label text-on-surface-variant uppercase tracking-widest">ID</div>
          <div className="col-span-2 text-xs font-label text-on-surface-variant uppercase tracking-widest">Vulnerability / Target</div>
          <div className="text-xs font-label text-on-surface-variant uppercase tracking-widest text-center">Severity</div>
          <div className="text-xs font-label text-on-surface-variant uppercase tracking-widest text-center">Status</div>
          <div className="text-xs font-label text-on-surface-variant uppercase tracking-widest text-right">Detected</div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredVulnerabilities.length > 0 ? filteredVulnerabilities.map((vuln, i) => (
            <motion.div 
              key={vuln.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-6 border-b border-outline-variant/10 hover:bg-surface-variant/20 transition-colors group cursor-pointer relative"
            >
              <div className="grid grid-cols-6 gap-4 items-center">
                <div className="text-sm font-mono text-on-surface-variant">{vuln.id}</div>
                <div className="col-span-2">
                  <h4 className="text-sm font-bold group-hover:text-primary transition-colors">{vuln.type}</h4>
                  <p className="text-xs text-on-surface-variant mt-1">{vuln.target}</p>
                </div>
                <div 
                  className="flex justify-center items-center relative"
                  onMouseEnter={() => setHoveredVuln(vuln.id)}
                  onMouseLeave={() => setHoveredVuln(null)}
                >
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    vuln.severity === 'critical' ? 'bg-error/10 text-error border border-error/20' : 
                    vuln.severity === 'high' ? 'bg-primary/10 text-primary border border-primary/20' : 
                    'bg-tertiary/10 text-tertiary border border-tertiary/20'
                  }`}>
                    {vuln.severity}
                  </span>

                  <AnimatePresence>
                    {hoveredVuln === vuln.id && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="absolute bottom-full mb-2 z-50 w-48 glass-panel p-4 rounded-xl border-primary/20 shadow-2xl pointer-events-none"
                      >
                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Severity Distribution</h5>
                        <div className="h-32 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                              { name: 'Critical', value: severityStats.critical.count, fill: '#ef4444' },
                              { name: 'High', value: severityStats.high.count, fill: '#ec4899' },
                              { name: 'Medium', value: severityStats.medium.count, fill: '#3b82f6' },
                              { name: 'Low', value: severityStats.low.count, fill: '#94a3b8' },
                            ]}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                              <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.5)' }} 
                              />
                              <YAxis hide />
                              <Tooltip 
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                              />
                              <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-on-surface-variant">Frequency:</span>
                            <span className="text-primary font-bold">{severityStats[vuln.severity].percent}%</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-on-surface-variant">Total Found:</span>
                            <span className="text-primary font-bold">{severityStats[vuln.severity].count}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex justify-center items-center">
                  <div className="flex items-center gap-2">
                    {vuln.status === 'open' ? <Clock size={14} className="text-on-surface-variant" /> : 
                     vuln.status === 'mitigated' ? <CheckCircle2 size={14} className="text-tertiary" /> : 
                     <StopCircle size={14} className="text-on-surface-variant" />}
                    <span className="text-xs font-label capitalize">{vuln.status}</span>
                  </div>
                </div>
                <div className="text-xs font-mono text-on-surface-variant text-right flex flex-col justify-center">
                  <div>{vuln.timestamp.split(' ')[0]}</div>
                  <div className="opacity-50">{vuln.timestamp.split(' ')[1]}</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-6">
                <div className="p-4 bg-surface-variant/10 rounded-xl border border-outline-variant/10">
                  <h5 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Description</h5>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{vuln.description}</p>
                </div>
                <div className="p-4 bg-surface-variant/10 rounded-xl border border-outline-variant/10">
                  <h5 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Vulnerability Timeline</h5>
                  <div className="space-y-4 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-outline-variant/20">
                    <div className="flex gap-4 relative">
                      <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center z-10 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-on-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">Detected</p>
                        <p className="text-[10px] text-on-surface-variant">{vuln.detectedAt}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 relative">
                      <div className="w-4 h-4 rounded-full bg-tertiary flex items-center justify-center z-10 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-on-tertiary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">Last Updated</p>
                        <p className="text-[10px] text-on-surface-variant">{vuln.updatedAt}</p>
                      </div>
                    </div>
                    {vuln.resolvedAt && (
                      <div className="flex gap-4 relative">
                        <div className={`w-4 h-4 rounded-full ${vuln.status === 'mitigated' ? 'bg-success' : 'bg-on-surface-variant'} flex items-center justify-center z-10 mt-1`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-background" />
                        </div>
                        <div>
                          <p className="text-xs font-bold">{vuln.status === 'mitigated' ? 'Mitigated' : 'Ignored'}</p>
                          <p className="text-[10px] text-on-surface-variant">{vuln.resolvedAt}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="p-12 text-center opacity-30">
              <Search size={48} className="mx-auto mb-4" />
              <p className="text-sm font-label">No vulnerabilities match your current filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};const Terminal = ({ user, logs, setScanTarget, setActiveScreen }: { 
  user: FirebaseUser, 
  logs: LogEntry[],
  setScanTarget: (t: string) => void,
  setActiveScreen: (s: any) => void
}) => {
  const [input, setInput] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const commands = [
    { cmd: 'scan [target]', desc: 'Initiate a vulnerability scan on target IP/Domain', params: ['192.168.1.1', 'api.prod.io'] },
    { cmd: 'map --deep', desc: 'Perform deep network topology mapping', params: ['--deep', '--quick'] },
    { cmd: 'vuln --list', desc: 'Display current vulnerability registry', params: ['--list', '--export'] },
    { cmd: 'clear', desc: 'Clear the terminal console', params: [] },
    { cmd: 'status', desc: 'Check engine and node health status', params: [] },
    { cmd: 'report --ai', desc: 'Generate AI-powered threat analysis', params: ['--ai', '--pdf'] },
  ];

  useEffect(() => {
    const parts = input.toLowerCase().split(' ');
    const cmdPart = parts[0];
    const argPart = parts.length > 1 ? parts[1] : '';

    if (!input.trim()) {
      setSuggestions([]);
      setSuggestionIndex(-1);
      return;
    }

    if (parts.length === 1) {
      const filtered = commands
        .map(c => c.cmd.split(' ')[0])
        .filter(c => c.startsWith(cmdPart));
      setSuggestions(filtered);
    } else {
      const command = commands.find(c => c.cmd.startsWith(cmdPart));
      if (command && command.params) {
        const filtered = command.params.filter(p => p.startsWith(argPart));
        setSuggestions(filtered.map(p => `${cmdPart} ${p}`));
      } else {
        setSuggestions([]);
      }
    }
    setSuggestionIndex(-1);
  }, [input]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleCommand = async (e: React.FormEvent | string) => {
    if (typeof e !== 'string') e.preventDefault();
    const cmdToRun = typeof e === 'string' ? e : input;
    if (!cmdToRun.trim()) return;

    setInput('');
    setSuggestions([]);
    setHistory(prev => [cmdToRun, ...prev]);
    setHistoryIndex(-1);

    const parts = cmdToRun.trim().split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    if (command === 'clear') {
      try {
        const q = query(collection(db, 'logs'), where('uid', '==', user.uid));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      } catch (err) {
        console.error("Clear failed:", err);
      }
      return;
    }

    if (command === 'scan' && args) {
      setScanTarget(args);
      setActiveScreen('penetration');
      return;
    }

    try {
      // Add command log to Firestore
      await addDoc(collection(db, 'logs'), {
        timestamp: new Date().toLocaleTimeString([], { hour12: false }),
        level: 'info',
        message: `> ${cmdToRun}`,
        uid: user.uid
      });

      const response = await fetch('/api/terminal/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmdToRun })
      });

      if (!response.ok) throw new Error('Terminal command failed');
      const data = await response.json();

      // Add response log to Firestore
      await addDoc(collection(db, 'logs'), {
        timestamp: data.timestamp,
        level: data.level,
        message: data.message,
        uid: user.uid
      });
    } catch (err) {
      await addDoc(collection(db, 'logs'), {
        timestamp: new Date().toLocaleTimeString([], { hour12: false }),
        level: 'error',
        message: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        uid: user.uid
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSuggestionIndex(prev => (prev <= 0 ? suggestions.length - 1 : prev - 1));
      } else if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSuggestionIndex(prev => (prev >= suggestions.length - 1 ? 0 : prev + 1));
      } else if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestions.length > 0) {
        const index = suggestionIndex === -1 ? 0 : suggestionIndex;
        setInput(suggestions[index]);
        setSuggestions([]);
      }
    } else if (e.key === 'Enter') {
      if (suggestionIndex !== -1) {
        e.preventDefault();
        handleCommand(suggestions[suggestionIndex]);
      }
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-headline font-bold text-on-surface">Command Center</h2>
          <p className="text-on-surface-variant mt-1">Direct interface to the reconnaissance engine.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-2 px-4 py-2 bg-surface-variant/50 rounded-xl border border-outline-variant/20 hover:text-primary transition-colors"
          >
            <HelpCircle size={16} />
            <span className="text-sm font-label">Command Guide</span>
          </button>
          <button 
            onClick={() => {}}
            className="flex items-center gap-2 px-4 py-2 bg-surface-variant/50 rounded-xl border border-outline-variant/20 hover:bg-surface-bright transition-colors"
          >
            <RefreshCw size={16} />
            <span className="text-sm font-label">Clear Console</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        <div className="flex-1 glass-panel rounded-3xl overflow-hidden flex flex-col bg-black/60 border-primary/10">
          <div className="flex items-center gap-2 px-6 py-3 border-b border-outline-variant/20 bg-surface-variant/20">
            <TerminalIcon size={16} className="text-primary" />
            <span className="text-xs font-mono text-primary uppercase tracking-widest">RG-SHELL v2.4.0</span>
            <div className="ml-auto flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-error/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-tertiary/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-primary/50" />
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 font-mono text-sm space-y-2 scrollbar-thin scrollbar-thumb-primary/20">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-4">
                <span className="text-on-surface-variant opacity-50">[{log.timestamp}]</span>
                <span className={`
                  ${log.level === 'info' ? 'text-on-surface' : ''}
                  ${log.level === 'success' ? 'text-tertiary' : ''}
                  ${log.level === 'warn' ? 'text-primary' : ''}
                  ${log.level === 'error' ? 'text-error' : ''}
                `}>
                  {log.message}
                </span>
              </div>
            ))}
            <div className="h-4" />
          </div>

          <form onSubmit={handleCommand} className="p-6 border-t border-outline-variant/20 bg-surface-variant/10 relative">
            <AnimatePresence>
              {suggestions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-6 mb-2 w-64 glass-panel rounded-xl border border-primary/20 shadow-2xl overflow-hidden z-50"
                >
                  {suggestions.map((s, i) => (
                    <div 
                      key={i} 
                      onClick={() => handleCommand(s)}
                      className={`p-3 cursor-pointer border-b border-outline-variant/5 last:border-none text-xs font-mono flex items-center justify-between group transition-colors ${
                        suggestionIndex === i ? 'bg-primary/20 text-primary' : 'text-primary hover:bg-primary/10'
                      }`}
                    >
                      <span>{s}</span>
                      <ChevronRight size={12} className={`transition-opacity ${suggestionIndex === i ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex items-center gap-4">
              <ChevronRight size={20} className="text-primary" />
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter command... (type 'help' for guide)"
                className="flex-1 bg-transparent border-none outline-none text-primary font-mono placeholder:text-primary/20"
                autoFocus
              />
            </div>
          </form>
        </div>

        <AnimatePresence>
          {showHelp && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="glass-panel rounded-3xl p-6 border-primary/10 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Command Guide</h3>
                <button onClick={() => setShowHelp(false)} className="text-on-surface-variant hover:text-primary">
                  <EyeOff size={16} />
                </button>
              </div>
              <div className="space-y-6">
                {commands.map((c) => (
                  <div key={c.cmd} className="space-y-1">
                    <code 
                      onClick={() => {
                        const cmd = c.cmd.split(' ')[0];
                        setInput(cmd + ' ');
                        setShowHelp(false);
                      }}
                      className="text-xs text-primary font-mono bg-primary/10 px-2 py-0.5 rounded cursor-pointer hover:bg-primary/20 transition-colors"
                    >
                      {c.cmd}
                    </code>
                    <p className="text-[10px] text-on-surface-variant leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-4 rounded-xl bg-surface-variant/30 border border-outline-variant/20">
                <p className="text-[10px] text-on-surface-variant italic">
                  Tip: Use the 'scan' command with a target IP to initiate immediate reconnaissance.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const Penetration = ({ initialTarget = '', user, scanHistory, scanPresets }: { 
  initialTarget?: string, 
  user: FirebaseUser,
  scanHistory: ScanHistoryEntry[],
  scanPresets: ScanPreset[]
}) => {
  const [target, setTarget] = useState(initialTarget);
  const [intensity, setIntensity] = useState('Standard (Balanced)');
  const [engineMode, setEngineMode] = useState('Automated');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [steps, setSteps] = useState<{ msg: string, status: 'pending' | 'active' | 'done' }[]>([]);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [currentRiskScore, setCurrentRiskScore] = useState<number | null>(null);
  const [liveLogs, setLiveLogs] = useState<{ msg: string, level: 'info' | 'success' | 'warn' | 'error' }[]>([]);
  
  const [selectedHistory, setSelectedHistory] = useState<ScanHistoryEntry | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  
  const reportRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (initialTarget) {
      setTarget(initialTarget);
      // Start analysis automatically if triggered from outside
      startAnalysis(initialTarget);
    }
  }, [initialTarget]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const savePreset = async () => {
    const name = prompt('Enter preset name:');
    if (!name) return;
    try {
      await addDoc(collection(db, 'scanPresets'), {
        name,
        intensity,
        mode: engineMode,
        uid: user.uid,
        timestamp: new Date().toISOString()
      });
      
      // Add log
      await addDoc(collection(db, 'logs'), {
        timestamp: new Date().toLocaleTimeString(),
        level: 'success',
        message: `Preset "${name}" saved successfully.`,
        uid: user.uid
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'scanPresets');
    }
  };

  const loadPreset = (preset: ScanPreset) => {
    setIntensity(preset.intensity);
    setEngineMode(preset.mode);
  };

  const viewHistory = (entry: ScanHistoryEntry) => {
    setSelectedHistory(entry);
    setShowSummaryModal(true);
    setTarget(entry.target);
    setAiReport(entry.report);
    setSteps([
      { msg: 'Resolving target address...', status: 'done' },
      { msg: 'Mapping network perimeter...', status: 'done' },
      { msg: 'Identifying service banners...', status: 'done' },
      { msg: 'Testing vulnerability vectors...', status: 'done' },
      { msg: 'Generating risk assessment...', status: 'done' },
    ]);
  };

  const generateAiAnalysis = async (target: string, scanResult: any) => {
    setIsGeneratingAi(true);
    setLiveLogs(prev => [...prev, { msg: 'Initiating AI-powered threat analysis...', level: 'info' }]);
    
    if (!process.env.GEMINI_API_KEY) {
      const errorMsg = 'Error: GEMINI_API_KEY is not configured in the environment.';
      setLiveLogs(prev => [...prev, { msg: errorMsg, level: 'error' }]);
      setAiReport(errorMsg);
      await addToHistory(target, errorMsg, scanResult);
      setIsGeneratingAi(false);
      return;
    }

    const prompt = `As a cybersecurity expert, provide a detailed risk analysis for a penetration test on the target: ${target}. 
    The scan found the following vulnerabilities: ${JSON.stringify(scanResult.vulnerabilities)}.
    The calculated risk score is ${scanResult.riskScore}/100.
    
    Please provide:
    1. An executive summary of the security posture.
    2. A breakdown of the most critical threats found.
    3. Actionable recommendations for mitigation.
    
    Keep it professional, technical, and concise.`;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      const report = response.text || 'Analysis generation failed.';
      setAiReport(report);
      setLiveLogs(prev => [...prev, { msg: 'AI analysis report generated successfully.', level: 'success' }]);
      await addToHistory(target, report, scanResult);
    } catch (geminiError) {
      console.error('Gemini failed:', geminiError);
      const errorMsg = `AI analysis failed: ${geminiError instanceof Error ? geminiError.message : 'Service unavailable'}`;
      setLiveLogs(prev => [...prev, { msg: errorMsg, level: 'error' }]);
      const report = 'Error: AI analysis service unavailable. Please check Gemini configuration.';
      setAiReport(report);
      await addToHistory(target, report, scanResult);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const addToHistory = async (target: string, report: string, scanResult: any) => {
    const findings = scanResult.vulnerabilities.map((v: any) => ({
      severity: v.severity,
      title: v.type,
      description: v.description
    }));

    if (findings.length === 0) {
      findings.push({ severity: 'low', title: 'Clean Scan', description: 'No immediate vulnerabilities detected during this phase.' });
    }

    const newEntry = {
      target,
      date: new Date().toLocaleString(),
      status: 'completed',
      report,
      intensity,
      mode: engineMode,
      riskScore: scanResult.riskScore || 0,
      findings,
      uid: user.uid
    };

    try {
      await addDoc(collection(db, 'scanHistory'), newEntry);
      
      // Also add vulnerabilities to the vulnerabilities collection
      for (const v of scanResult.vulnerabilities) {
        await addDoc(collection(db, 'vulnerabilities'), {
          target,
          type: v.type,
          severity: v.severity,
          status: 'open',
          timestamp: new Date().toISOString(),
          description: v.description,
          uid: user.uid
        });
      }

      // Add log
      await addDoc(collection(db, 'logs'), {
        timestamp: new Date().toLocaleTimeString(),
        level: 'success',
        message: `Scan completed for ${target}. Found ${scanResult.vulnerabilities.length} vulnerabilities.`,
        uid: user.uid
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'scanHistory');
    }
  };

  const downloadPdf = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`RECONGUARD_Report_${target.replace(/[^a-z0-9]/gi, '_')}.pdf`);
  };

  const purgeHistory = async () => {
    const confirmed = window.confirm('Are you sure you want to purge all scan history? This action is irreversible.');
    if (!confirmed) return;
    try {
      const q = query(collection(db, 'scanHistory'), where('uid', '==', user.uid));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      
      await addDoc(collection(db, 'logs'), {
        timestamp: new Date().toLocaleTimeString(),
        level: 'warn',
        message: 'Scan history purged by operator.',
        uid: user.uid
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'scanHistory');
    }
  };

  const deleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'scanHistory', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'scanHistory');
    }
  };

  const startAnalysis = async (targetOverride?: string) => {
    const finalTarget = targetOverride || target;
    if (!finalTarget) return;
    setIsAnalyzing(true);
    setAiReport(null);
    setCurrentRiskScore(null);
    setLiveLogs([{ msg: `Initializing scan on ${finalTarget}...`, level: 'info' }]);
    setSteps([
      { msg: 'Resolving target address...', status: 'active' },
      { msg: 'Mapping network perimeter...', status: 'pending' },
      { msg: 'Identifying service banners...', status: 'pending' },
      { msg: 'Testing vulnerability vectors...', status: 'pending' },
      { msg: 'Generating risk assessment...', status: 'pending' },
    ]);

    try {
      // Add log (non-blocking)
      addDoc(collection(db, 'logs'), {
        timestamp: new Date().toLocaleTimeString(),
        level: 'info',
        message: `Initiating scan on ${finalTarget}...`,
        uid: user.uid
      }).catch(e => console.warn('Failed to save log to Firestore:', e));

      // Start visual simulation steps immediately
      let currentStep = 0;
      const totalSteps = 5;
      intervalRef.current = setInterval(() => {
        setSteps(prev => prev.map((s, i) => {
          if (i < currentStep) return { ...s, status: 'done' };
          if (i === currentStep) return { ...s, status: 'active' };
          return s;
        }));
        currentStep++;
        if (currentStep > totalSteps) {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }, 800);

      // Call Backend API
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: finalTarget, intensity, mode: engineMode })
      });

      let scanResult;
      if (!response.ok) {
        console.warn('Backend scan failed, falling back to simulation.');
        setLiveLogs(prev => [...prev, { msg: 'Backend unavailable. Using local simulation engine.', level: 'warn' }]);
        
        // Mock result for simulation fallback
        scanResult = {
          target: finalTarget,
          riskScore: Math.floor(Math.random() * 40) + 30,
          vulnerabilities: [
            { id: 'SIM-001', type: 'Potential SQL Injection', severity: 'high', target: finalTarget, description: 'Simulated vulnerability for testing.' },
            { id: 'SIM-002', type: 'Weak SSH Config', severity: 'medium', target: finalTarget, description: 'Simulated vulnerability for testing.' }
          ]
        };
      } else {
        const data = await response.json();
        setLiveLogs(prev => [...prev, { msg: `Backend scan completed (ID: ${data.scanId}).`, level: 'success' }]);
        scanResult = data.result;
      }
      
      if (scanResult && scanResult.riskScore !== undefined) {
        setCurrentRiskScore(scanResult.riskScore);
      }
      
      // Wait for visual steps to finish if they haven't
      const checkFinished = setInterval(() => {
        if (currentStep >= totalSteps) {
          clearInterval(checkFinished);
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsAnalyzing(false);
          generateAiAnalysis(finalTarget, scanResult);
        }
      }, 500);

    } catch (err) {
      console.error("Scan Error:", err);
      setLiveLogs(prev => [...prev, { msg: `Scan Error: ${err instanceof Error ? err.message : 'Unknown error'}. Switching to simulation.`, level: 'warn' }]);
      
      // Final fallback to simulation
      const mockResult = {
        target: finalTarget,
        riskScore: 45,
        vulnerabilities: [{ id: 'SIM-ERR', type: 'Network Timeout', severity: 'low', target: finalTarget, description: 'Scan completed with simulated data due to backend error.' }]
      };
      
      setCurrentRiskScore(mockResult.riskScore);
      setTimeout(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsAnalyzing(false);
        generateAiAnalysis(finalTarget, mockResult);
      }, 2000);
    }
  };

  const progress = steps.length > 0 
    ? (steps.filter(s => s.status === 'done').length / steps.length) * 100 
    : 0;

  return (
    <div className="p-8 h-full flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-headline font-bold text-on-surface">Risk Analysis</h2>
          <p className="text-on-surface-variant mt-1">Deep penetration testing and security assessment.</p>
        </div>
        <div className="flex gap-4">
          {aiReport && (
            <button 
              onClick={downloadPdf}
              className="flex items-center gap-2 px-4 py-2 bg-surface-variant/50 rounded-xl border border-outline-variant/20 hover:text-primary transition-colors"
            >
              <Download size={16} />
              <span className="text-sm font-label">Download PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Modal */}
      <AnimatePresence>
        {showSummaryModal && selectedHistory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSummaryModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl glass-panel rounded-3xl p-8 shadow-2xl border border-primary/20"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-headline font-bold">Scan Summary</h3>
                    <p className="text-xs text-on-surface-variant font-mono">{selectedHistory.id} • {selectedHistory.date}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSummaryModal(false)}
                  className="p-2 hover:bg-surface-variant rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-surface-variant/30 border border-outline-variant/10">
                      <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest mb-1">Target</p>
                      <p className="text-sm font-bold text-primary truncate">{selectedHistory.target}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-surface-variant/30 border border-outline-variant/10">
                      <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest mb-1">Intensity</p>
                      <p className="text-sm font-bold text-secondary truncate">{selectedHistory.intensity.split(' ')[0]}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-surface-variant/30 border border-outline-variant/10">
                      <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest mb-1">Risk Score</p>
                      <p className={`text-sm font-bold ${
                        (selectedHistory.riskScore || 0) > 80 ? 'text-error' : 
                        (selectedHistory.riskScore || 0) > 50 ? 'text-primary' : 'text-tertiary'
                      }`}>
                        {selectedHistory.riskScore || 'N/A'}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-surface-variant/30 border border-outline-variant/10">
                      <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest mb-1">Status</p>
                      <p className={`text-sm font-bold ${selectedHistory.status === 'completed' ? 'text-tertiary' : 'text-error'}`}>
                        {selectedHistory.status.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-2 mb-4 text-primary">
                      <Sparkles size={18} />
                      <h4 className="text-sm font-bold uppercase tracking-widest">Executive Summary</h4>
                    </div>
                    <div className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap font-body">
                      {selectedHistory.report}
                    </div>
                  </div>

                  {selectedHistory.findings && selectedHistory.findings.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle size={16} className="text-secondary" />
                        Key Findings
                      </h4>
                      <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                        {selectedHistory.findings.map((finding, idx) => (
                          <div key={idx} className="p-4 rounded-xl bg-surface-variant/20 border border-outline-variant/10 flex gap-4">
                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                              finding.severity === 'critical' ? 'bg-error shadow-[0_0_8px_rgba(255,110,132,0.5)]' :
                              finding.severity === 'high' ? 'bg-primary' :
                              finding.severity === 'medium' ? 'bg-secondary' : 'bg-tertiary'
                            }`} />
                            <div>
                              <h5 className="text-sm font-bold">{finding.title}</h5>
                              <p className="text-xs text-on-surface-variant mt-1">{finding.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setShowSummaryModal(false)}
                      className="flex-1 py-4 bg-surface-variant hover:bg-surface-variant/70 text-on-surface font-bold rounded-2xl transition-colors"
                    >
                      Close
                    </button>
                    <button 
                      onClick={() => {
                        setShowSummaryModal(false);
                        downloadPdf();
                      }}
                      className="px-6 py-4 bg-primary text-surface font-bold rounded-2xl hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                      <Download size={18} />
                      Report
                    </button>
                  </div>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-panel rounded-3xl p-8 space-y-8">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-label text-on-surface-variant uppercase tracking-widest">Target IP or Domain</label>
              <div className="flex gap-2">
                {scanPresets.map(p => (
                  <button 
                    key={p.id} 
                    onClick={() => {
                      setTarget(p.target);
                      setIntensity(p.intensity);
                      setEngineMode(p.mode);
                    }}
                    className="text-[10px] font-mono text-on-surface-variant hover:text-primary transition-colors border-b border-outline-variant/20"
                  >
                    {p.name}
                  </button>
                ))}
                <button onClick={savePreset} className="text-[10px] font-mono text-primary hover:underline">+ Save</button>
              </div>
            </div>
            <div className="relative">
              <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
              <input 
                type="text" 
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="e.g. 192.168.1.1 or example.com"
                className="w-full bg-surface-variant/50 border border-outline-variant/20 rounded-2xl py-4 pl-12 pr-6 text-lg focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-surface-variant/30 border border-outline-variant/10">
                <span className="block text-[10px] font-label text-on-surface-variant uppercase mb-2">Scan Intensity</span>
                <select 
                  value={intensity}
                  onChange={(e) => setIntensity(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold outline-none cursor-pointer"
                >
                  <option>Stealth (Passive)</option>
                  <option>Standard (Balanced)</option>
                  <option>Aggressive (Deep)</option>
                </select>
              </div>
              <div className="p-4 rounded-2xl bg-surface-variant/30 border border-outline-variant/10">
                <span className="block text-[10px] font-label text-on-surface-variant uppercase mb-2">Engine Mode</span>
                <select 
                  value={engineMode}
                  onChange={(e) => setEngineMode(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold outline-none cursor-pointer"
                >
                  <option>Automated</option>
                  <option>Manual Override</option>
                </select>
              </div>
            </div>

            <button 
              onClick={() => startAnalysis()}
              disabled={isAnalyzing || !target}
              className="w-full py-4 bg-primary text-surface font-headline font-bold rounded-2xl hover:opacity-90 transition-opacity neon-glow-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isAnalyzing ? <RefreshCw className="animate-spin" size={20} /> : <Play size={20} />}
              {isAnalyzing ? 'Analyzing Target...' : 'Initiate Penetration Test'}
            </button>

            <div className="p-6 rounded-2xl bg-error/5 border border-error/10">
              <div className="flex gap-3">
                <AlertTriangle className="text-error shrink-0" size={20} />
                <div>
                  <h4 className="text-sm font-bold text-error">Ethical Use Warning</h4>
                  <p className="text-xs text-on-surface-variant mt-1">Unauthorized penetration testing is illegal. Ensure you have explicit permission before targeting any network asset.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-headline font-bold">Scan History</h3>
              {scanHistory.length > 0 && (
                <button 
                  onClick={purgeHistory}
                  className="flex items-center gap-2 px-3 py-1.5 bg-error/10 text-error rounded-xl border border-error/20 hover:bg-error/20 transition-colors text-xs font-label"
                >
                  <AlertTriangle size={14} />
                  <span>Purge History</span>
                </button>
              )}
            </div>
            <div className="space-y-4">
              {scanHistory.map((entry) => (
                <div 
                  key={entry.id} 
                  onClick={() => viewHistory(entry)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                    selectedHistory?.id === entry.id ? 'bg-primary/10 border-primary' : 'bg-surface-variant/30 border-outline-variant/10 hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${entry.status === 'completed' ? 'bg-tertiary/10 text-tertiary' : 'bg-error/10 text-error'}`}>
                      <FileText size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold group-hover:text-primary transition-colors">{entry.target}</h4>
                      <p className="text-[10px] text-on-surface-variant font-mono">{entry.date} • {entry.intensity}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                      entry.status === 'completed' ? 'text-tertiary' : 'text-error'
                    }`}>
                      {entry.status}
                    </span>
                    <div className="flex items-center gap-2">
                      <ChevronRight size={16} className="text-on-surface-variant group-hover:text-primary transition-colors" />
                      <button 
                        onClick={(e) => deleteHistoryItem(entry.id, e)}
                        className="p-2 hover:bg-error/10 text-on-surface-variant hover:text-error rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete entry"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-8 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-headline font-bold">Analysis Feed</h3>
            {liveLogs.length > 0 && (
              <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest animate-pulse">Live Feed Active</span>
            )}
          </div>
          
          <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            <div className="space-y-4 max-h-[40%] overflow-y-auto pr-2 custom-scrollbar">
              {steps.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-12">
                  <Search size={48} className="mb-4" />
                  <p className="text-sm font-label">Enter a target and start analysis to see live results.</p>
                </div>
              ) : (
                steps.map((step, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4"
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                      step.status === 'done' ? 'bg-tertiary/20 border-tertiary text-tertiary' :
                      step.status === 'active' ? 'bg-primary/20 border-primary text-primary animate-pulse' :
                      'bg-surface-variant border-outline-variant/20 text-on-surface-variant'
                    }`}>
                      {step.status === 'done' ? <CheckCircle2 size={12} /> : <div className="w-1 h-1 rounded-full bg-current" />}
                    </div>
                    <span className={`text-xs font-label ${step.status === 'active' ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`}>
                      {step.msg}
                    </span>
                  </motion.div>
                ))
              )}
            </div>

            {liveLogs.length > 0 && (
              <div className="p-4 bg-black/40 rounded-xl border border-outline-variant/10 font-mono text-[10px] space-y-1 overflow-y-auto max-h-[30%] custom-scrollbar">
                {liveLogs.map((log, i) => (
                  <div key={i} className={`flex gap-2 ${
                    log.level === 'error' ? 'text-error' : 
                    log.level === 'success' ? 'text-tertiary' : 
                    log.level === 'warn' ? 'text-secondary' : 'text-on-surface-variant'
                  }`}>
                    <span className="opacity-50">[{new Date().toLocaleTimeString()}]</span>
                    <span>{log.msg}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {(isGeneratingAi || aiReport) && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-2xl bg-primary/5 border border-primary/10"
                  ref={reportRef}
                >
                  <div className="flex items-center gap-2 mb-4 text-primary">
                    <Sparkles size={18} />
                    <h4 className="text-sm font-bold uppercase tracking-widest">AI Threat Analysis</h4>
                  </div>
                  
                  {isGeneratingAi ? (
                    <div className="flex flex-col gap-3">
                      <div className="h-3 w-full bg-primary/10 rounded-full animate-pulse" />
                      <div className="h-3 w-5/6 bg-primary/10 rounded-full animate-pulse" />
                      <div className="h-3 w-4/6 bg-primary/10 rounded-full animate-pulse" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {currentRiskScore !== null && (
                        <div className="p-4 rounded-xl bg-surface-variant/20 border border-outline-variant/10">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Calculated Risk Score</span>
                            <span className={`text-lg font-bold ${
                              currentRiskScore > 80 ? 'text-error' : 
                              currentRiskScore > 50 ? 'text-primary' : 'text-tertiary'
                            }`}>{currentRiskScore}/100</span>
                          </div>
                          <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${currentRiskScore}%` }}
                              className={`h-full ${
                                currentRiskScore > 80 ? 'bg-error' : 
                                currentRiskScore > 50 ? 'bg-primary' : 'bg-tertiary'
                              }`}
                            />
                          </div>
                        </div>
                      )}
                      <div className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap font-body">
                        {aiReport}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
          {isAnalyzing && (
            <div className="mt-8 p-4 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-mono text-primary uppercase tracking-widest">Processing Data...</span>
                <span className="text-xs font-mono text-primary">{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary neon-glow-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AboutDeveloper = () => {
  const [isFlowchartExpanded, setIsFlowchartExpanded] = useState(false);
  const projectStructure = [
    { name: 'src/', type: 'folder', children: [
      { name: 'App.tsx', type: 'file' },
      { name: 'firebase.ts', type: 'file' },
      { name: 'index.css', type: 'file' },
      { name: 'main.tsx', type: 'file' },
    ]},
    { name: 'backend/', type: 'folder', children: [
      { name: 'scanner.py', type: 'file' },
      { name: 'logic.py', type: 'file' },
    ]},
    { name: 'server.ts', type: 'file' },
    { name: 'firestore.rules', type: 'file' },
    { name: 'firebase-blueprint.json', type: 'file' },
    { name: 'metadata.json', type: 'file' },
    { name: 'package.json', type: 'file' },
  ];

  const renderTree = (items: any[], depth = 0) => {
    return items.map((item, i) => (
      <div key={i} className="space-y-1">
        <div className="flex items-center gap-2 py-1 hover:bg-surface-variant/20 rounded px-2 transition-colors cursor-default" style={{ paddingLeft: `${depth * 20 + 8}px` }}>
          {item.type === 'folder' ? <Globe size={14} className="text-primary" /> : <FileText size={14} className="text-on-surface-variant" />}
          <span className={`text-xs font-mono ${item.type === 'folder' ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`}>{item.name}</span>
        </div>
        {item.children && renderTree(item.children, depth + 1)}
      </div>
    ));
  };

  return (
    <div className="p-8 h-full flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-headline font-bold text-on-surface">About the Developer</h2>
          <p className="text-on-surface-variant mt-1">The mind behind RECONGUARD.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <div className="glass-panel rounded-3xl p-8 flex flex-col items-center text-center">
            <div className="w-48 h-48 rounded-2xl overflow-hidden border-2 border-primary neon-glow-primary mb-6 flex items-center justify-center bg-surface-variant/20">
              <User size={120} className="text-primary/40" />
            </div>
            <h3 className="text-2xl font-headline font-bold text-primary">Jayalle Pangilinan</h3>
            
            <div className="mt-8 space-y-4 text-left w-full">
              <div className="p-4 rounded-2xl bg-surface-variant/30 border border-outline-variant/10">
                <h4 className="text-[10px] font-label text-primary uppercase tracking-widest mb-2">Education</h4>
                <p className="text-sm font-body leading-relaxed">Graduated Bachelor of Science in Computer Science in Technological Institute of the Philippines - Manila.</p>
              </div>
              <div className="p-4 rounded-2xl bg-surface-variant/30 border border-outline-variant/10">
                <h4 className="text-[10px] font-label text-secondary uppercase tracking-widest mb-2">Specialization</h4>
                <p className="text-sm font-body leading-relaxed">Deeply interested in Data Science and Cybersecurity, blending analytics with threat detection.</p>
              </div>
              <div className="p-4 rounded-2xl bg-surface-variant/30 border border-outline-variant/10">
                <h4 className="text-[10px] font-label text-tertiary uppercase tracking-widest mb-2">Current Status</h4>
                <p className="text-sm font-body leading-relaxed">Currently traveling while developing projects, drawing inspiration from diverse environments.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <section className={`glass-panel rounded-3xl p-8 transition-all duration-500 ${isFlowchartExpanded ? 'fixed inset-4 z-[100] overflow-y-auto bg-surface/95 backdrop-blur-2xl' : ''}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-headline font-bold flex items-center gap-3">
                <Activity size={20} className="text-primary" />
                System Architecture Flowchart
              </h3>
              <button 
                onClick={() => setIsFlowchartExpanded(!isFlowchartExpanded)}
                className="p-2 rounded-xl bg-surface-variant/50 text-on-surface-variant hover:text-primary transition-all border border-outline-variant/20"
              >
                {isFlowchartExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
            </div>
            <div className={`p-8 bg-surface-variant/20 rounded-2xl border border-outline-variant/10 flex flex-col items-center gap-8 overflow-x-auto ${isFlowchartExpanded ? 'min-h-[800px]' : ''}`}>
              <svg width="800" height="750" viewBox="0 0 800 750" className={`max-w-full transition-transform duration-500 ${isFlowchartExpanded ? 'scale-110' : 'scale-100'}`}>
                {/* Step 1 */}
                <rect x="300" y="20" width="200" height="50" rx="8" className="fill-primary/20 stroke-primary stroke-2" />
                <text x="400" y="45" textAnchor="middle" className="fill-on-surface text-[10px] font-mono font-bold uppercase">User Input</text>
                <text x="400" y="60" textAnchor="middle" className="fill-on-surface-variant text-[8px] font-mono">(Target IP Addr)</text>

                {/* Step 2 */}
                <rect x="300" y="110" width="200" height="50" rx="8" className="fill-secondary/20 stroke-secondary stroke-2" />
                <text x="400" y="135" textAnchor="middle" className="fill-on-surface text-[10px] font-mono font-bold uppercase">Network Scanner</text>
                <text x="400" y="150" textAnchor="middle" className="fill-on-surface-variant text-[8px] font-mono">(Port Scanning)</text>

                {/* Step 3 */}
                <rect x="300" y="200" width="200" height="50" rx="8" className="fill-tertiary/20 stroke-tertiary stroke-2" />
                <text x="400" y="225" textAnchor="middle" className="fill-on-surface text-[10px] font-mono font-bold uppercase">Service Detection</text>
                <text x="400" y="240" textAnchor="middle" className="fill-on-surface-variant text-[8px] font-mono">(HTTP, DNS, SSH...)</text>

                {/* Step 4 Parallel */}
                <rect x="50" y="300" width="200" height="50" rx="8" className="fill-error/20 stroke-error stroke-2" />
                <text x="150" y="325" textAnchor="middle" className="fill-on-surface text-[10px] font-mono font-bold uppercase">Risk Analyzer</text>
                <text x="150" y="340" textAnchor="middle" className="fill-on-surface-variant text-[8px] font-mono">(Score/Level)</text>

                <rect x="300" y="300" width="200" height="50" rx="8" className="fill-primary/20 stroke-primary stroke-2" />
                <text x="400" y="325" textAnchor="middle" className="fill-on-surface text-[10px] font-mono font-bold uppercase">Banner Grabbing</text>
                <text x="400" y="340" textAnchor="middle" className="fill-on-surface-variant text-[8px] font-mono">(Service Info)</text>

                <rect x="550" y="300" width="200" height="50" rx="8" className="fill-secondary/20 stroke-secondary stroke-2" />
                <text x="650" y="325" textAnchor="middle" className="fill-on-surface text-[10px] font-mono font-bold uppercase">CVE Mapping</text>
                <text x="650" y="340" textAnchor="middle" className="fill-on-surface-variant text-[8px] font-mono">(Vulnerability DB)</text>

                {/* Step 5 */}
                <rect x="250" y="400" width="300" height="50" rx="8" className="fill-tertiary/20 stroke-tertiary stroke-2" />
                <text x="400" y="425" textAnchor="middle" className="fill-on-surface text-[10px] font-mono font-bold uppercase">Data Aggregation Layer</text>
                <text x="400" y="440" textAnchor="middle" className="fill-on-surface-variant text-[8px] font-mono">(Structured Security Findings)</text>

                {/* Step 6 */}
                <rect x="250" y="490" width="300" height="100" rx="8" className="fill-error/20 stroke-error stroke-2" />
                <text x="400" y="515" textAnchor="middle" className="fill-on-surface text-[10px] font-mono font-bold uppercase">AI Analysis Engine</text>
                <text x="400" y="530" textAnchor="middle" className="fill-on-surface-variant text-[8px] font-mono">(Local LLM via Ollama)</text>
                <text x="400" y="550" textAnchor="middle" className="fill-on-surface-variant text-[8px] font-mono">- Summary | - Attack Surface</text>
                <text x="400" y="565" textAnchor="middle" className="fill-on-surface-variant text-[8px] font-mono">- Recommendations</text>

                {/* Step 7 Parallel */}
                <rect x="50" y="640" width="200" height="50" rx="8" className="fill-primary/20 stroke-primary stroke-2" />
                <text x="150" y="665" textAnchor="middle" className="fill-on-surface text-[10px] font-mono font-bold uppercase">CLI Output</text>
                <text x="150" y="680" textAnchor="middle" className="fill-on-surface-variant text-[8px] font-mono">(Terminal)</text>

                <rect x="300" y="640" width="200" height="50" rx="8" className="fill-secondary/20 stroke-secondary stroke-2" />
                <text x="400" y="665" textAnchor="middle" className="fill-on-surface text-[10px] font-mono font-bold uppercase">Web Dashboard</text>
                <text x="400" y="680" textAnchor="middle" className="fill-on-surface-variant text-[8px] font-mono">(Flask + UI)</text>

                <rect x="550" y="640" width="200" height="50" rx="8" className="fill-tertiary/20 stroke-tertiary stroke-2" />
                <text x="650" y="665" textAnchor="middle" className="fill-on-surface text-[10px] font-mono font-bold uppercase">Report Gen</text>
                <text x="650" y="680" textAnchor="middle" className="fill-on-surface-variant text-[8px] font-mono">(MD / PDF)</text>

                {/* Arrows */}
                <path d="M400 70 L400 110" className="stroke-primary fill-none" strokeWidth="2" />
                <path d="M400 160 L400 200" className="stroke-secondary fill-none" strokeWidth="2" />
                
                <path d="M400 250 L400 275" className="stroke-tertiary fill-none" strokeWidth="2" />
                <path d="M150 275 L650 275" className="stroke-tertiary fill-none" strokeWidth="2" />
                <path d="M150 275 L150 300" className="stroke-tertiary fill-none" strokeWidth="2" />
                <path d="M400 275 L400 300" className="stroke-tertiary fill-none" strokeWidth="2" />
                <path d="M650 275 L650 300" className="stroke-tertiary fill-none" strokeWidth="2" />

                <path d="M150 350 L150 375" className="stroke-error fill-none" strokeWidth="2" />
                <path d="M400 350 L400 375" className="stroke-primary fill-none" strokeWidth="2" />
                <path d="M650 350 L650 375" className="stroke-secondary fill-none" strokeWidth="2" />
                <path d="M150 375 L650 375" className="stroke-on-surface-variant fill-none" strokeWidth="2" />
                <path d="M400 375 L400 400" className="stroke-on-surface-variant fill-none" strokeWidth="2" />

                <path d="M400 450 L400 490" className="stroke-tertiary fill-none" strokeWidth="2" />

                <path d="M400 590 L400 615" className="stroke-error fill-none" strokeWidth="2" />
                <path d="M150 615 L650 615" className="stroke-error fill-none" strokeWidth="2" />
                <path d="M150 615 L150 640" className="stroke-error fill-none" strokeWidth="2" />
                <path d="M400 615 L400 640" className="stroke-error fill-none" strokeWidth="2" />
                <path d="M650 615 L650 640" className="stroke-error fill-none" strokeWidth="2" />
              </svg>

              <div className="w-full space-y-4 text-left">
                <div className="p-4 rounded-xl bg-surface/50 border border-outline-variant/10">
                  <h4 className="text-xs font-bold text-primary mb-2 uppercase tracking-widest">Process Overview</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    RECONGUARD operates as a multi-stage security analysis pipeline. From <span className="text-primary font-bold">User Input</span>, it initiates <span className="text-secondary font-bold">Network Scanning</span> and <span className="text-tertiary font-bold">Service Detection</span>. Data is then processed in parallel through <span className="text-error font-bold">Risk Analysis</span>, <span className="text-primary font-bold">Banner Grabbing</span>, and <span className="text-secondary font-bold">CVE Mapping</span>. All findings are aggregated and passed to a <span className="text-error font-bold">Local AI Engine</span> (Ollama) for deep contextual analysis before being delivered via <span className="text-primary font-bold">CLI</span>, <span className="text-secondary font-bold">Web Dashboard</span>, or <span className="text-tertiary font-bold">PDF Reports</span>.
                  </p>
                </div>
                
                <div className="p-4 rounded-xl bg-surface/50 border border-outline-variant/10">
                  <h4 className="text-xs font-bold text-secondary mb-2 uppercase tracking-widest">Core Pipeline</h4>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">01</div>
                      <div>
                        <p className="text-[10px] font-bold text-on-surface uppercase">Reconnaissance Phase</p>
                        <p className="text-[9px] text-on-surface-variant">Target IP identification followed by intensive port scanning and service fingerprinting.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-secondary/20 border border-secondary/50 flex items-center justify-center text-[10px] font-bold text-secondary shrink-0">02</div>
                      <div>
                        <p className="text-[10px] font-bold text-on-surface uppercase">Vulnerability Assessment</p>
                        <p className="text-[9px] text-on-surface-variant">Parallel execution of banner grabbing, risk scoring, and mapping services to known CVE databases.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-tertiary/20 border border-tertiary/50 flex items-center justify-center text-[10px] font-bold text-tertiary shrink-0">03</div>
                      <div>
                        <p className="text-[10px] font-bold text-on-surface uppercase">AI Synthesis</p>
                        <p className="text-[9px] text-on-surface-variant">Aggregated findings are analyzed by a local LLM to generate attack surface summaries and actionable recommendations.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-success/20 border border-success/50 flex items-center justify-center text-[10px] font-bold text-success shrink-0">04</div>
                      <div>
                        <p className="text-[10px] font-bold text-on-surface uppercase">Multi-Channel Reporting</p>
                        <p className="text-[9px] text-on-surface-variant">Final results are pushed to the web UI, terminal output, and generated as professional PDF/MD reports.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="glass-panel rounded-3xl p-8">
            <h3 className="text-xl font-headline font-bold mb-6 flex items-center gap-3">
              <Database size={20} className="text-secondary" />
              Project Structure
            </h3>
            <div className="p-6 bg-surface-variant/20 rounded-2xl border border-outline-variant/10 font-mono">
              {renderTree(projectStructure)}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const Settings = ({ user }: { user: FirebaseUser }) => {
  const { theme, setTheme } = useTheme();
  
  // Data Management State
  const [isExporting, setIsExporting] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  // Profile State
  const [alias, setAlias] = useState(user.displayName || '');
  const [isSavingAlias, setIsSavingAlias] = useState(false);

  // Load settings from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setAlias(data.displayName || user.displayName || '');
        if (data.settings) {
          if (data.settings.theme && data.settings.theme !== theme) {
            setTheme(data.settings.theme);
          }
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });
    return () => unsub();
  }, [user.uid, theme, setTheme]);

  const updateSetting = async (key: string, value: any) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        [`settings.${key}`]: value
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch all user data
      const historyQ = query(collection(db, 'scanHistory'), where('uid', '==', user.uid));
      const vulnerabilitiesQ = query(collection(db, 'vulnerabilities'), where('uid', '==', user.uid));
      const logsQ = query(collection(db, 'logs'), where('uid', '==', user.uid));

      const [historySnap, vulnerabilitiesSnap, logsSnap] = await Promise.all([
        getDocs(historyQ),
        getDocs(vulnerabilitiesQ),
        getDocs(logsQ)
      ]);

      const data = {
        user: {
          email: user.email,
          displayName: user.displayName,
          uid: user.uid
        },
        scanHistory: historySnap.docs.map(d => ({ id: d.id, ...d.data() })),
        vulnerabilities: vulnerabilitiesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        logs: logsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        exportedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RECONGUARD_Export_${user.uid.substring(0, 8)}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Log export
      await addDoc(collection(db, 'logs'), {
        timestamp: new Date().toLocaleTimeString(),
        level: 'info',
        message: 'User data package exported successfully.',
        uid: user.uid
      });
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePurge = async () => {
    // Custom modal instead of confirm
    const confirmed = window.confirm('Are you sure you want to purge all scan history? This action is irreversible.');
    if (!confirmed) return;

    setIsPurging(true);
    try {
      const q = query(collection(db, 'scanHistory'), where('uid', '==', user.uid));
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      // Log purge
      await addDoc(collection(db, 'logs'), {
        timestamp: new Date().toLocaleTimeString(),
        level: 'warn',
        message: 'Scan history purged by operator.',
        uid: user.uid
      });
      
      alert('Scan history purged successfully.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'scanHistory');
    } finally {
      setIsPurging(false);
    }
  };

  const handleLogout = () => {
    auth.signOut();
  };

  const handleSaveAlias = async () => {
    setIsSavingAlias(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: alias
      });
      // Log alias update
      await addDoc(collection(db, 'logs'), {
        timestamp: new Date().toLocaleTimeString(),
        level: 'info',
        message: `Operator alias updated to: ${alias}`,
        uid: user.uid
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSavingAlias(false);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-headline font-bold text-on-surface">Settings</h2>
          <p className="text-on-surface-variant mt-1">Configure your RECONGUARD instance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="glass-panel !bg-surface/10 rounded-3xl p-8">
            <h3 className="text-xl font-headline font-bold mb-6 flex items-center gap-3">
              <User size={20} className="text-primary" />
              Profile Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">Operator Alias</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    className="flex-1 bg-surface-variant/50 border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder="Enter alias..."
                  />
                  <button 
                    onClick={handleSaveAlias}
                    disabled={isSavingAlias || alias === user.displayName}
                    className="px-4 py-2 bg-primary/10 text-primary rounded-xl border border-primary/20 hover:bg-primary/20 transition-all disabled:opacity-30"
                  >
                    {isSavingAlias ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">Security Clearance</label>
                <div className="w-full bg-surface-variant/50 border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-tertiary font-bold uppercase">
                  {user.email === 'jayallep@gmail.com' ? 'LEVEL 5 - OVERSEER' : 'LEVEL 1 - OPERATOR'}
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-label text-on-surface-variant uppercase tracking-widest">Notification Email</label>
                <div className="w-full bg-surface-variant/50 border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface">
                  {user.email}
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-6">
              <div className="space-y-4 p-4 rounded-2xl bg-surface-variant/30 border border-outline-variant/10">
                <div>
                  <h4 className="text-sm font-bold">Interface Theme</h4>
                  <p className="text-xs text-on-surface-variant mt-1">Select your preferred system aesthetic.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'theme-dark', label: 'Dark Mode', color: 'bg-[#ff8aa9]' },
                    { id: 'theme-cyberpunk', label: 'Cyberpunk', color: 'bg-[#d674ff]' },
                    { id: 'theme-matrix', label: 'Matrix', color: 'bg-[#00ff41]' },
                    { id: 'theme-spiderman', label: 'Spider-Man', color: 'bg-[#f11e22]' },
                    { id: 'theme-midnight', label: 'Midnight', color: 'bg-[#00d2ff]' },
                    { id: 'theme-toxic', label: 'Toxic', color: 'bg-[#ccff00]' },
                    { id: 'theme-light', label: 'Light Mode', color: 'bg-white border border-slate-200' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id);
                        updateSetting('theme', t.id);
                      }}
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                        theme === t.id ? 'border-primary bg-primary/10' : 'border-outline-variant/20 hover:border-primary/50'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full ${t.color}`} />
                      <span className="text-[10px] font-bold uppercase tracking-tight">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-6 py-3 bg-error/10 text-error font-headline font-bold rounded-xl border border-error/20 hover:bg-error/20 transition-all"
                >
                  <LogOut size={18} />
                  Terminate Session
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="glass-panel rounded-3xl p-8">
            <h3 className="text-xl font-headline font-bold mb-6 flex items-center gap-3">
              <Database size={20} className="text-secondary" />
              Data Management
            </h3>
            <div className="space-y-4">
              <button 
                onClick={handleExport}
                disabled={isExporting}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-surface-variant/30 border border-outline-variant/10 hover:bg-surface-variant/50 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  {isExporting ? <RefreshCw size={16} className="animate-spin text-primary" /> : <Download size={16} className="text-on-surface-variant" />}
                  <span className="text-sm font-bold">{isExporting ? 'Exporting...' : 'Export All Data'}</span>
                </div>
                <ChevronRight size={16} className="text-on-surface-variant" />
              </button>
              <button 
                onClick={handlePurge}
                disabled={isPurging}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-surface-variant/30 border border-outline-variant/10 hover:bg-surface-variant/50 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  {isPurging ? <RefreshCw size={16} className="animate-spin text-error" /> : <RefreshCw size={16} className="text-error" />}
                  <span className="text-sm font-bold text-error">{isPurging ? 'Purging...' : 'Purge Scan History'}</span>
                </div>
                <ChevronRight size={16} className="text-on-surface-variant" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeScreen, setActiveScreen] = useState<Screen>('dashboard');
  const [scanTarget, setScanTarget] = useState('');
  const [showSplash, setShowSplash] = useState(true);
  const [theme, setTheme] = useState<string>(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'theme-dark';
  });

  // Global Data State (Synced with Firestore)
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([]);
  const [scanPresets, setScanPresets] = useState<ScanPreset[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Sync Vulnerabilities
    const qVulns = query(collection(db, 'vulnerabilities'), where('uid', '==', user.uid));
    const unsubVulns = onSnapshot(qVulns, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Vulnerability));
      setVulnerabilities(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'vulnerabilities'));

    // Sync Scan History
    const qHistory = query(collection(db, 'scanHistory'), where('uid', '==', user.uid));
    const unsubHistory = onSnapshot(qHistory, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as any));
      setScanHistory(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'scanHistory'));

    // Sync Presets
    const qPresets = query(collection(db, 'scanPresets'), where('uid', '==', user.uid));
    const unsubPresets = onSnapshot(qPresets, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ScanPreset));
      setScanPresets(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'scanPresets'));

    // Sync Logs
    const qLogs = query(collection(db, 'logs'), where('uid', '==', user.uid));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as LogEntry));
      setLogs(data.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 50));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'logs'));

    return () => {
      unsubVulns();
      unsubHistory();
      unsubPresets();
      unsubLogs();
    };
  }, [user]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    const root = document.documentElement;
    const themes = ['theme-dark', 'theme-cyberpunk', 'theme-matrix', 'theme-spiderman', 'theme-midnight', 'theme-toxic', 'theme-light'];
    themes.forEach(t => root.classList.remove(t));
    root.classList.add(theme);
  }, [theme]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw size={48} className="text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={() => {}} />;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div className="flex h-screen w-full bg-background text-on-surface overflow-hidden relative">
        <AnimatePresence>
          {showSplash && (
            <SplashScreen onComplete={() => setShowSplash(false)} />
          )}
        </AnimatePresence>

        {/* Background Effects */}
        {theme === 'theme-spiderman' && <SpiderWeb />}
        {theme === 'theme-matrix' && <MatrixRain />}
        {theme === 'theme-toxic' && <ToxicGas />}
        {theme === 'theme-midnight' && <StarGalaxy />}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 aurora-blur rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 aurora-blur rounded-full pointer-events-none" />
        <div className="scanline-overlay" />

        <Sidebar activeScreen={activeScreen} setScreen={setActiveScreen} />

        <main className="flex-1 flex flex-col relative">
          <Header />
          
          <div className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {!showSplash && (
                <motion.div
                  key={activeScreen}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="absolute inset-0"
                >
                  {activeScreen === 'dashboard' && (
                    <Dashboard 
                      onNavigate={setActiveScreen} 
                      onNewScan={() => setActiveScreen('penetration')}
                      vulnerabilities={vulnerabilities}
                      scanHistory={scanHistory}
                    />
                  )}
                  {activeScreen === 'network' && (
                    <NetworkMap onScan={(t) => {
                      setScanTarget(t);
                      setActiveScreen('penetration');
                    }} />
                  )}
                  {activeScreen === 'penetration' && (
                    <Penetration 
                      initialTarget={scanTarget} 
                      user={user}
                      scanHistory={scanHistory}
                      scanPresets={scanPresets}
                    />
                  )}
                  {activeScreen === 'vulnerabilities' && (
                    <Vulnerabilities 
                      vulnerabilities={vulnerabilities}
                    />
                  )}
                  {activeScreen === 'terminal' && (
                    <Terminal 
                      user={user}
                      logs={logs}
                      setScanTarget={setScanTarget}
                      setActiveScreen={setActiveScreen}
                    />
                  )}
                  {activeScreen === 'about' && <AboutDeveloper />}
                  {activeScreen === 'settings' && <Settings user={user} />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </ThemeContext.Provider>
  );
}
