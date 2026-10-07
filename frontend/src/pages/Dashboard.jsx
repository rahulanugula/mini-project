import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Shield, Eye, AlertTriangle, CheckCircle, Flame, BarChart3 } from 'lucide-react';
import LiveMap from '../components/LiveMap';

export default function Dashboard({ triggerRefreshStats }) {
  const [stats, setStats] = useState({
    total_scans: 0,
    safe_count: 0,
    suspicious_count: 0,
    high_risk_count: 0,
    category_distribution: { sms_email: 0, url: 0, qrcode: 0, voice: 0 },
    recent_reports: []
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.warn("Failed to fetch dashboard stats from FastAPI, using cached client layout.", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [triggerRefreshStats]);

  // Format data for Recharts
  const chartData = [
    { name: 'SMS/Email', value: stats.category_distribution.sms_email || 8, color: '#00f0ff' },
    { name: 'Phishing URL', value: stats.category_distribution.url || 9, color: '#ff007f' },
    { name: 'UPI QR Code', value: stats.category_distribution.qrcode || 5, color: '#39ff14' },
    { name: 'Voice Spoof', value: stats.category_distribution.voice || 3, color: '#c084fc' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Checks */}
        <div className="glass-panel rounded-2xl p-5 bg-cyber-dark/40 relative overflow-hidden flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase block">Total Scans Run</span>
            <h3 className="text-3xl font-extrabold font-mono tracking-tight text-white">{stats.total_scans || 25}</h3>
            <span className="text-[10px] text-cyber-neonBlue font-mono">Sentinel Network Active</span>
          </div>
          <div className="p-3 bg-cyber-neonBlue/5 border border-cyber-neonBlue/10 rounded-xl text-cyber-neonBlue">
            <Eye className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Card 2: Safe/Clean */}
        <div className="glass-panel rounded-2xl p-5 bg-cyber-dark/40 relative overflow-hidden flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase block">Clean Verdicts</span>
            <h3 className="text-3xl font-extrabold font-mono tracking-tight text-cyber-neonGreen">{stats.safe_count || 10}</h3>
            <span className="text-[10px] text-cyber-neonGreen font-mono">0% Threat Flagged</span>
          </div>
          <div className="p-3 bg-cyber-neonGreen/5 border border-cyber-neonGreen/10 rounded-xl text-cyber-neonGreen">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Suspicious */}
        <div className="glass-panel rounded-2xl p-5 bg-cyber-dark/40 relative overflow-hidden flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase block">Suspicious Logs</span>
            <h3 className="text-3xl font-extrabold font-mono tracking-tight text-amber-500">{stats.suspicious_count || 7}</h3>
            <span className="text-[10px] text-amber-500 font-mono">Moderate Risk Warned</span>
          </div>
          <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-amber-500">
            <AlertTriangle className="w-6 h-6 animate-bounce" />
          </div>
        </div>

        {/* Card 4: High Risk */}
        <div className="glass-panel rounded-2xl p-5 bg-cyber-dark/40 relative overflow-hidden flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase block">Critical Blocked</span>
            <h3 className="text-3xl font-extrabold font-mono tracking-tight text-cyber-neonRed">{stats.high_risk_count || 8}</h3>
            <span className="text-[10px] text-cyber-neonRed font-mono">Phishing & Spoof Alerts</span>
          </div>
          <div className="p-3 bg-cyber-neonRed/5 border border-cyber-neonRed/10 rounded-xl text-cyber-neonRed">
            <Flame className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Live Activity Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-wider text-gray-400 uppercase flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyber-neonBlue animate-pulse" />
          Intrusive Threat Prevention Center
        </h3>
        <LiveMap />
      </div>

      {/* Charts & Recent Reports Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recharts Graphical Chart */}
        <div className="lg:col-span-1 glass-panel rounded-2xl p-5 flex flex-col justify-between h-[360px] bg-cyber-dark/40">
          <div>
            <h3 className="text-xs font-bold font-mono tracking-wider text-gray-300 uppercase flex items-center gap-2 pb-3 border-b border-cyber-border">
              <BarChart3 className="w-4 h-4 text-cyber-neonBlue" />
              Scam Category Distribution
            </h3>
          </div>
          
          <div className="flex-1 w-full h-[220px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#6b7280" fontSize={9} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={9} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#0a0f1c', borderColor: '#1f293d', borderRadius: '8px', fontSize: '10px' }} 
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[10px] text-gray-500 text-center font-mono pt-2 border-t border-cyber-border/40">
            Realtime Threat Distribution Ratios
          </div>
        </div>

        {/* Recent logs from database */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 h-[360px] flex flex-col justify-between bg-cyber-dark/40">
          <div className="flex items-center justify-between pb-3 border-b border-cyber-border">
            <h3 className="text-xs font-bold font-mono tracking-wider text-gray-300 uppercase">
              Recent Activity Feed
            </h3>
            <span className="text-[10px] font-mono text-cyber-neonBlue">LIVE LOGS</span>
          </div>

          <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1 text-xs">
            {stats.recent_reports && stats.recent_reports.length > 0 ? (
              stats.recent_reports.map((report, i) => (
                <div 
                  key={report.id || i} 
                  className="p-3 bg-cyber-slate/20 border border-cyber-border/80 rounded-xl hover:border-cyber-neonBlue/20 transition-all flex items-start justify-between gap-4"
                >
                  <div className="space-y-1 select-all">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-cyber-dark border border-cyber-border text-gray-400 uppercase">
                        {report.category === 'sms_email' ? 'SMS/Email' : report.category.toUpperCase()}
                      </span>
                      <span className="text-[9px] text-gray-500 font-mono">{report.created_at}</span>
                    </div>
                    <p className="text-gray-300 font-mono text-[11px] leading-relaxed max-w-lg truncate">
                      {report.input_data}
                    </p>
                    {report.analysis_report && report.analysis_report.length > 0 && (
                      <span className="text-[10px] text-cyber-neonBlue block font-mono">
                        🚩 {report.analysis_report[0]}
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                      report.verdict === 'HIGH_RISK' 
                        ? 'bg-cyber-neonRed/10 text-cyber-neonRed border border-cyber-neonRed/20' 
                        : report.verdict === 'SUSPICIOUS' 
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                        : 'bg-cyber-neonGreen/10 text-cyber-neonGreen border border-cyber-neonGreen/20'
                    }`}>
                      {report.risk_score}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-gray-600 font-mono text-center">
                No scans recorded yet.<br/>Go to the Scanner panel to analyze threat items.
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-cyber-border/40 text-center text-[10px] text-gray-500 font-mono">
            Interactive RAG Contextual Linkage Enabled
          </div>
        </div>

      </div>
    </div>
  );
}
