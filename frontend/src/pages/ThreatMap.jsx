import React, { useEffect, useState } from 'react';
import { Search, Filter, ShieldAlert, FileText, ChevronRight } from 'lucide-react';

export default function ThreatMap({ triggerRefreshStats }) {
  const [reports, setReports] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchReports = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/stats');
      if (response.ok) {
        const data = await response.json();
        setReports(data.recent_reports || []);
      }
    } catch (err) {
      console.warn("Failed to fetch reports feed from database. Using fallback.", err);
      // Fallback mocks
      setReports([
        {
          id: 1,
          category: "sms_email",
          input_data: "URGENT: Verify your HDFC credit card reward points immediately by clicking here...",
          risk_score: 90,
          verdict: "HIGH_RISK",
          analysis_report: ["Creates artificial urgency.", "Contains suspicious external URL link."],
          recommendation: "Do not open links from unverified numbers. Check HDFC official website.",
          created_at: "2026-07-02 12:44:00"
        },
        {
          id: 2,
          category: "qrcode",
          input_data: "UPI Payment QR code requesting ₹2,000",
          risk_score: 80,
          verdict: "HIGH_RISK",
          analysis_report: ["QR Code requests UPI transfer transaction automatically.", "Payee name is generic."],
          recommendation: "NPCI: A UPI PIN is only needed to transfer money, never to receive it.",
          created_at: "2026-07-02 12:20:00"
        },
        {
          id: 3,
          category: "url",
          input_data: "http://secure-sbi-netbanking-verify.xyz/login",
          risk_score: 95,
          verdict: "HIGH_RISK",
          analysis_report: ["Uses unencrypted connection HTTP.", "Suspicious Top-Level Domain (.xyz).", "Impersonates SBI domain."],
          recommendation: "CERT-In: Verify official domain endings and avoid entering credentials.",
          created_at: "2026-07-02 11:35:00"
        }
      ]);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [triggerRefreshStats]);

  // Apply filters
  const filteredReports = reports.filter((item) => {
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesSeverity = filterSeverity === 'all' || item.verdict === filterSeverity;
    const matchesSearch = !searchQuery.trim() || 
      (item.input_data && item.input_data.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.recommendation && item.recommendation.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSeverity && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Filtering Header Card */}
      <div className="glass-panel rounded-2xl p-4 bg-cyber-dark/40 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search threats..."
            className="w-full bg-cyber-slate/30 border border-cyber-border rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-cyber-neonBlue/50 text-xs font-mono"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          {/* Category Filter */}
          <div className="flex items-center gap-1 bg-cyber-slate/30 border border-cyber-border rounded-xl px-2.5 py-1.5 text-xs text-gray-400 font-mono">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-gray-300 focus:outline-none cursor-pointer text-xs"
            >
              <option value="all" className="bg-cyber-bg">All Categories</option>
              <option value="sms_email" className="bg-cyber-bg">SMS/Email</option>
              <option value="url" className="bg-cyber-bg">URLs</option>
              <option value="qrcode" className="bg-cyber-bg">QR Codes</option>
              <option value="voice" className="bg-cyber-bg">Voice Audio</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1 bg-cyber-slate/30 border border-cyber-border rounded-xl px-2.5 py-1.5 text-xs text-gray-400 font-mono">
            <ShieldAlert className="w-3.5 h-3.5" />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-gray-300 focus:outline-none cursor-pointer text-xs"
            >
              <option value="all" className="bg-cyber-bg">All Severities</option>
              <option value="SAFE" className="bg-cyber-bg">Clean / Safe</option>
              <option value="SUSPICIOUS" className="bg-cyber-bg">Suspicious</option>
              <option value="HIGH_RISK" className="bg-cyber-bg">High Risk</option>
            </select>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports Table list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel rounded-2xl overflow-hidden bg-cyber-dark/40 border border-cyber-border">
            <div className="p-4 border-b border-cyber-border bg-cyber-dark/65 flex justify-between items-center">
              <h3 className="text-xs font-bold font-mono tracking-wider text-gray-300 uppercase">
                Threat Database Grid
              </h3>
              <span className="text-[10px] text-gray-500 font-mono">{filteredReports.length} matches found</span>
            </div>

            <div className="divide-y divide-cyber-border/60 max-h-[460px] overflow-y-auto">
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className={`p-4 transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 border-l-2 hover:bg-cyber-slate/10 select-none ${
                      selectedReport?.id === report.id
                        ? 'bg-cyber-slate/20 border-cyber-neonBlue'
                        : report.verdict === 'HIGH_RISK'
                        ? 'border-cyber-neonRed'
                        : report.verdict === 'SUSPICIOUS'
                        ? 'border-amber-500'
                        : 'border-cyber-neonGreen'
                    }`}
                  >
                    <div className="space-y-1 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-cyber-dark border border-cyber-border text-gray-400 uppercase">
                          {report.category === 'sms_email' ? 'SMS/Email' : report.category.toUpperCase()}
                        </span>
                        <span className="text-[9px] text-gray-500 font-mono">{report.created_at}</span>
                      </div>
                      <p className="text-gray-300 text-xs truncate max-w-sm font-mono">
                        {report.input_data}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                        report.verdict === 'HIGH_RISK'
                          ? 'text-cyber-neonRed bg-cyber-neonRed/10 border border-cyber-neonRed/20'
                          : report.verdict === 'SUSPICIOUS'
                          ? 'text-amber-500 bg-amber-500/10 border border-amber-500/20'
                          : 'text-cyber-neonGreen bg-cyber-neonGreen/10 border border-cyber-neonGreen/20'
                      }`}>
                        {report.risk_score}%
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-gray-600 font-mono leading-relaxed">
                  No records matching the selected<br/>filters could be found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected Report Inspect drawer */}
        <div className="lg:col-span-1">
          {selectedReport ? (
            <div className="glass-panel rounded-2xl p-5 bg-cyber-dark/40 border border-cyber-border space-y-4 animate-fadeIn">
              <div className="pb-3 border-b border-cyber-border">
                <span className="text-[9px] font-mono tracking-widest text-cyber-neonBlue uppercase block mb-1">Inspect Node #{selectedReport.id}</span>
                <h4 className="font-extrabold text-sm text-gray-200 uppercase font-mono">
                  Full Threat Record
                </h4>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Category */}
                <div>
                  <span className="text-[9px] font-mono uppercase text-gray-500 block mb-0.5">Vector Category</span>
                  <span className="font-mono text-gray-300 capitalize">{selectedReport.category.replace('_', ' ')}</span>
                </div>

                {/* Date */}
                <div>
                  <span className="text-[9px] font-mono uppercase text-gray-500 block mb-0.5">Detection Time</span>
                  <span className="font-mono text-gray-300">{selectedReport.created_at}</span>
                </div>

                {/* Score */}
                <div>
                  <span className="text-[9px] font-mono uppercase text-gray-500 block mb-0.5">Threat Score</span>
                  <span className={`font-mono font-bold ${
                    selectedReport.verdict === 'HIGH_RISK' ? 'text-cyber-neonRed' : selectedReport.verdict === 'SUSPICIOUS' ? 'text-amber-500' : 'text-cyber-neonGreen'
                  }`}>
                    {selectedReport.risk_score}% ({selectedReport.verdict.replace('_', ' ')})
                  </span>
                </div>

                {/* Input Payload */}
                <div>
                  <span className="text-[9px] font-mono uppercase text-gray-500 block mb-0.5">Scanned Content Payload</span>
                  <p className="p-2.5 bg-cyber-slate/30 border border-cyber-border rounded-lg text-gray-400 font-mono text-[10px] break-all leading-relaxed whitespace-pre-wrap select-all">
                    {selectedReport.input_data}
                  </p>
                </div>

                {/* Forensics */}
                <div>
                  <span className="text-[9px] font-mono uppercase text-gray-500 block mb-1">Indicators Identified</span>
                  <ul className="space-y-1.5 pl-3 list-disc text-gray-400 text-[11px] leading-relaxed">
                    {(Array.isArray(selectedReport.analysis_report) 
                      ? selectedReport.analysis_report 
                      : (typeof selectedReport.analysis_report === 'string' && selectedReport.analysis_report.startsWith('[')
                        ? JSON.parse(selectedReport.analysis_report)
                        : [selectedReport.analysis_report])
                    ).map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>

                {/* RAG Advice */}
                <div>
                  <span className="text-[9px] font-mono uppercase text-gray-500 block mb-1">Cybersecurity Guard Recommendation</span>
                  <p className="p-3 bg-cyber-neonBlue/5 border border-cyber-neonBlue/10 rounded-lg text-[10px] leading-relaxed text-gray-400 font-mono">
                    {selectedReport.recommendation}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-6 bg-cyber-dark/40 border border-cyber-border h-[200px] flex flex-col items-center justify-center text-center">
              <FileText className="w-8 h-8 text-gray-600 mb-2" />
              <p className="text-xs text-gray-500 font-mono leading-relaxed">
                Select a threat event from<br/>the database grid to inspect details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
