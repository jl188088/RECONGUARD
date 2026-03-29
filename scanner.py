import sys
import json
import time
import random

def simulate_scan(target, intensity):
    print(f"[*] Starting RECONGUARD Python Scanner v1.0.0", file=sys.stderr)
    print(f"[*] Target: {target}", file=sys.stderr)
    print(f"[*] Intensity: {intensity}", file=sys.stderr)
    
    steps = [
        "Resolving target address...",
        "Mapping network perimeter...",
        "Identifying service banners...",
        "Analyzing vulnerability vectors...",
        "Mapping CVE database...",
        "Calculating risk score...",
        "Finalizing report..."
    ]
    
    for step in steps:
        print(f"[+] {step}", file=sys.stderr)
        sys.stderr.flush()
        time.sleep(0.3) # Faster simulation
        
    # Simulate finding vulnerabilities based on target and intensity
    vulnerabilities = []
    
    # Common vulnerabilities pool
    vuln_pool = [
        {"type": "SQL Injection", "severity": "critical", "description": "Potential SQL injection vulnerability found on endpoint /api/v1/users"},
        {"type": "XSS Vulnerability", "severity": "high", "description": "Reflected XSS vulnerability detected on login page"},
        {"type": "Weak SSH Credentials", "severity": "high", "description": "Default or weak SSH credentials detected on port 22"},
        {"type": "Outdated Nginx Version", "severity": "medium", "description": "The Nginx server version is outdated and contains known security vulnerabilities"},
        {"type": "Exposed API Key", "severity": "high", "description": "A production API key was found in a publicly accessible configuration file"},
        {"type": "Open Directory Listing", "severity": "low", "description": "Directory listing is enabled on /uploads directory"},
        {"type": "Insecure CORS Policy", "severity": "medium", "description": "CORS policy allows access from any origin (*)"},
        {"type": "Broken Authentication", "severity": "critical", "description": "Session tokens are not properly invalidated after logout"},
        {"type": "Sensitive Data Exposure", "severity": "high", "description": "Unencrypted sensitive data found in response headers"},
        {"type": "Security Misconfiguration", "severity": "medium", "description": "Default error pages are enabled, revealing system information"}
    ]
    
    # Determine number of vulnerabilities based on intensity
    num_vulns = 0
    if "Stealth" in intensity:
        num_vulns = random.randint(0, 2)
    elif "Standard" in intensity:
        num_vulns = random.randint(1, 4)
    else: # Aggressive
        num_vulns = random.randint(3, 7)
        
    vulnerabilities = random.sample(vuln_pool, min(num_vulns, len(vuln_pool)))
    
    # Calculate a simulated risk score
    severity_weights = {"critical": 25, "high": 15, "medium": 8, "low": 3}
    base_score = 10
    risk_score = base_score + sum(severity_weights.get(v["severity"], 0) for v in vulnerabilities)
    risk_score = min(100, risk_score) # Cap at 100
    
    return {
        "target": target,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "vulnerabilities": vulnerabilities,
        "riskScore": risk_score,
        "summary": f"Scan completed for {target}. Found {len(vulnerabilities)} vulnerabilities with a risk score of {risk_score}/100."
    }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing arguments"}))
        sys.exit(1)
        
    target = sys.argv[1]
    intensity = sys.argv[2]
    
    try:
        result = simulate_scan(target, intensity)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
