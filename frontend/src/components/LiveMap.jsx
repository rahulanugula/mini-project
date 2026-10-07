import React, { useEffect, useState } from 'react';
import { Terminal, ShieldCheck } from 'lucide-react';

const INDIAN_CITIES = [
  { name: "Mumbai", x: 30, y: 65 },
  { name: "Delhi", x: 40, y: 30 },
  { name: "Bangalore", x: 42, y: 80 },
  { name: "Hyderabad", x: 45, y: 68 },
  { name: "Chennai", x: 48, y: 82 },
  { name: "Kolkata", x: 75, y: 48 },
  { name: "Pune", x: 32, y: 68 },
  { name: "Ahmedabad", x: 25, y: 50 },
  { name: "Jaipur", x: 32, y: 38 },
];

const SCAM_TYPES = [
  { label: "Smishing Blocked", color: "text-cyber-neonBlue", bg: "bg-cyber-neonBlue" },
  { label: "Phishing Link Deflected", color: "text-cyber-neonRed", bg: "bg-cyber-neonRed" },
  { label: "UPI Fraud Intercepted", color: "text-amber-400", bg: "bg-amber-400" },
  { label: "Deepfake Spoof Blocked", color: "text-purple-400", bg: "bg-purple-400" },
];

export default function LiveMap() {
  const [activeThreat, setActiveThreat] = useState(null);
  const [threatLogs, setThreatLogs] = useState([
    { id: 1, text: "SENTINEL Shield Active - Listening on Gateway 1930", type: "system" },
    { id: 2, text: "RAG Knowledge Indexing Verified", type: "system" },
    { id: 3, text: "SMS Phishing Blocked in Chennai", type: "threat" }
  ]);

  useEffect(() => {
    const threatInterval = setInterval(() => {
      // Pick random city and threat type
      const city = INDIAN_CITIES[Math.floor(Math.random() * INDIAN_CITIES.length)];
      const type = SCAM_TYPES[Math.floor(Math.random() * SCAM_TYPES.length)];
      
      const newThreat = {
        city: city.name,
        x: city.x,
        y: city.y,
        label: type.label,
        color: type.color,
        bg: type.bg,
        timestamp: new Date().toLocaleTimeString()
      };

      setActiveThreat(newThreat);

      // Add to logs
      setThreatLogs(prev => [
        {
          id: Date.now(),
          text: `[${newThreat.timestamp}] ${newThreat.label} (${newThreat.city})`,
          type: "threat"
        },
        ...prev.slice(0, 10)
      ]);

      // Clear marker after 1.5s
      setTimeout(() => {
        setActiveThreat(null);
      }, 1500);

    }, 3500);

    return () => clearInterval(threatInterval);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Visual Map Grid */}
      <div className="lg:col-span-2 glass-panel glass-panel-glow-blue rounded-2xl p-6 relative overflow-hidden h-[340px] flex items-center justify-center bg-cyber-dark/30">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 cyber-grid-bg opacity-40"></div>
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyber-neonBlue animate-pulse" />
          <span className="text-[10px] font-mono tracking-widest text-cyber-neonBlue uppercase font-bold">
            Live Threat Map (Simulation)
          </span>
        </div>

        {/* Map Coordinates & Lines */}
        <svg className="w-full h-full max-w-[450px] max-h-[280px] opacity-20 absolute pointer-events-none">
          {INDIAN_CITIES.map((c, i) => (
            <g key={i}>
              <circle cx={`${c.x}%`} cy={`${c.y}%`} r="2.5" fill="rgba(255,255,255,0.4)" />
              {/* Draw connected mesh lines to adjacent nodes */}
              {i < INDIAN_CITIES.length - 1 && (
                <line
                  x1={`${c.x}%`}
                  y1={`${c.y}%`}
                  x2={`${INDIAN_CITIES[i + 1].x}%`}
                  y2={`${INDIAN_CITIES[i + 1].y}%`}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="0.5"
                />
              )}
            </g>
          ))}
        </svg>

        {/* Active Ping Animation */}
        {activeThreat && (
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
            style={{ left: `${activeThreat.x}%`, top: `${activeThreat.y}%` }}
          >
            <span className="absolute flex h-10 w-10">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeThreat.bg}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${activeThreat.bg}`}></span>
            </span>
            <div className="absolute top-4 bg-cyber-dark/95 border border-cyber-border text-[9px] px-2 py-0.5 rounded font-mono text-white whitespace-nowrap shadow-xl">
              <span className={`${activeThreat.color} font-bold mr-1`}>{activeThreat.label}:</span>
              {activeThreat.city}
            </div>
          </div>
        )}

        {/* HUD Overlay Stats */}
        <div className="absolute bottom-4 right-4 text-right font-mono text-[9px] text-gray-500 space-y-0.5">
          <div>SCAN LATENCY: &lt;140ms</div>
          <div>INTERCEPT VERDICT: 99.8% ACC</div>
          <div>CYBER SEC LEVEL: SECURE</div>
        </div>
      </div>

      {/* Terminal log panel */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between h-[340px] bg-cyber-dark/40">
        <div className="flex items-center justify-between pb-3 border-b border-cyber-border/60 mb-3">
          <h3 className="text-xs font-bold font-mono tracking-wider text-gray-300 uppercase flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyber-neonBlue" />
            Intercept Log
          </h3>
          <span className="text-[9px] px-2 py-0.5 bg-cyber-neonGreen/10 text-cyber-neonGreen border border-cyber-neonGreen/20 font-mono rounded flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            SHIELD OK
          </span>
        </div>

        {/* Log Entries */}
        <div className="flex-1 overflow-y-auto space-y-2.5 font-mono text-[11px] pr-1">
          {threatLogs.map((log) => (
            <div 
              key={log.id} 
              className={`p-2 rounded border transition-all duration-300 ${
                log.type === 'system' 
                  ? 'bg-cyber-slate/20 border-cyber-border/40 text-gray-500' 
                  : 'bg-cyber-neonRed/5 border-cyber-neonRed/10 text-cyber-neonRed/90 hover:bg-cyber-neonRed/10'
              }`}
            >
              {log.text}
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-cyber-border/60 text-center text-[10px] text-gray-500 font-mono">
          Listening on ports [8000, 5173]
        </div>
      </div>
    </div>
  );
}
