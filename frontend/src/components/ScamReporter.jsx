import React, { useState } from 'react';
import { X, Send, AlertOctagon, CheckCircle2 } from 'lucide-react';

export default function ScamReporter({ isOpen, onClose, onReportSubmitted }) {
  const [category, setCategory] = useState('sms_email');
  const [inputData, setInputData] = useState('');
  const [riskScore, setRiskScore] = useState(80);
  const [verdict, setVerdict] = useState('HIGH_RISK');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleScoreChange = (val) => {
    setRiskScore(val);
    if (val >= 70) setVerdict('HIGH_RISK');
    else if (val >= 25) setVerdict('SUSPICIOUS');
    else setVerdict('SAFE');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputData.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          input_data: inputData,
          risk_score: parseInt(riskScore),
          verdict,
          analysis_report: [reason || "Community reported scam characteristics flagged."],
          recommendation: category === 'sms_email' 
            ? "Do not reply or click links. Report smishing to 1930."
            : category === 'url'
            ? "Avoid visiting. Block domain in security filters."
            : category === 'qrcode'
            ? "Do not scan to receive money. UPI PIN only transfers funds."
            : "AI Voice cloned alert. Do not send funds. Verify callers."
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setInputData('');
          setReason('');
          onReportSubmitted();
          onClose();
        }, 1800);
      }
    } catch (err) {
      console.error("Failed to submit report:", err);
      alert("Failed to submit report. Please check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop blur */}
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-lg glass-panel glass-panel-glow-red rounded-2xl overflow-hidden bg-cyber-dark/95 z-10 border border-cyber-neonRed/20">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-cyber-border bg-cyber-dark/80">
          <div className="flex items-center gap-2 text-cyber-neonRed">
            <AlertOctagon className="w-5 h-5 animate-pulse" />
            <h3 className="font-bold text-sm uppercase tracking-wider font-mono">
              Report Scam to Community
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {success ? (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-cyber-neonGreen/10 border border-cyber-neonGreen/30 rounded-full animate-bounce">
              <CheckCircle2 className="w-12 h-12 text-cyber-neonGreen" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-cyber-neonGreen glow-text-green font-mono">
                REPORT SUBMITTED
              </h4>
              <p className="text-xs text-gray-400 mt-1.5">
                Thank you for contributing to the SENTINEL threat database. Your submission is active.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {/* Category selection */}
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest text-gray-400 mb-1.5 font-semibold">
                Scam Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'sms_email', label: 'SMS / Email' },
                  { id: 'url', label: 'Phishing URL' },
                  { id: 'qrcode', label: 'UPI QR Code' },
                  { id: 'voice', label: 'Voice Scam' },
                ].map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`py-2 px-3 rounded-lg border text-left font-medium transition-all ${
                      category === cat.id
                        ? 'bg-cyber-neonRed/10 border-cyber-neonRed/40 text-cyber-neonRed'
                        : 'bg-cyber-slate/20 border-cyber-border text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Data / Text content */}
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest text-gray-400 mb-1.5 font-semibold">
                Scam Content (Text, Link, Phone, or Details)
              </label>
              <textarea
                required
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder={
                  category === 'sms_email' 
                    ? "Paste the SMS text e.g., 'Your card is blocked...'" 
                    : category === 'url'
                    ? "Paste the suspicious link e.g., 'http://fake-sbi.xyz'"
                    : category === 'qrcode'
                    ? "Explain the QR location/payee e.g., 'Fake QR sticker on local shop counter'"
                    : "Describe the call e.g., 'Grandparent scam call requesting 50k bail'"
                }
                className="w-full h-24 bg-cyber-slate/30 border border-cyber-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyber-neonRed/50 placeholder:text-gray-600 resize-none font-mono"
              />
            </div>

            {/* Indicator Details */}
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest text-gray-400 mb-1.5 font-semibold">
                Reason / Scam Indicators (Optional)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Asks for immediate UPI PIN entry"
                className="w-full bg-cyber-slate/30 border border-cyber-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-cyber-neonRed/50 placeholder:text-gray-600 font-mono"
              />
            </div>

            {/* Threat Level Slider */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-gray-400 font-semibold">
                  Threat Score: <span className="font-bold font-mono text-cyber-neonRed">{riskScore}%</span>
                </label>
                <span className={`text-[10px] font-bold font-mono uppercase ${
                  verdict === 'HIGH_RISK' ? 'text-cyber-neonRed' : verdict === 'SUSPICIOUS' ? 'text-amber-500' : 'text-cyber-neonGreen'
                }`}>
                  {verdict.replace('_', ' ')}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={riskScore}
                onChange={(e) => handleScoreChange(e.target.value)}
                className="w-full accent-cyber-neonRed bg-cyber-slate/40 rounded-lg h-1.5 cursor-pointer"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyber-neonRed to-pink-600 hover:from-pink-500 hover:to-cyber-neonRed text-white font-bold uppercase tracking-wider rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(255,0,127,0.15)] disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Threat Report
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
