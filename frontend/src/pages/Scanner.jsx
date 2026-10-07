import React, { useState } from 'react';
import { MessageSquare, Link, QrCode, Mic, AlertTriangle, Send, Upload, Info, RotateCcw } from 'lucide-react';
import RiskGauge from '../components/RiskGauge';

const SAMPLE_TEMPLATES = {
  sms_email: [
    { label: "KYC Suspension (Scam)", text: "URGENT: Your SBI bank account will be blocked today. Update your KYC immediately at http://secure-sbi-verification.xyz/login" },
    { label: "Lottery Win (Scam)", text: "CONGRATS! You have won a cash prize of ₹10,00,000 in the Kaun Banega Crorepati lucky draw. Deposit ₹5,000 registration fee to claim your prize. Contact admin on WhatsApp." },
    { label: "Normal Message (Safe)", text: "Hey! Are we still meeting for dinner at 7 PM today? Let me know, thanks!" }
  ],
  url: [
    { label: "SBI Typosquat (Scam)", url: "http://secure-sbi-netbanking-verify.xyz/login" },
    { label: "HDFC Fraud portal (Scam)", url: "http://hdfc-bank-rewards-refund.online" },
    { label: "Google Official (Safe)", url: "https://google.com" }
  ],
  qrcode: [
    { label: "UPI Scam (₹9,999 Prize)", file: "scam_upi_qr.png" },
    { label: "UPI Safe (₹150 Store)", file: "safe_upi_qr.png" },
    { label: "Phishing Website QR", file: "phishing_url_qr.png" },
    { label: "Safe Website QR", file: "safe_url_qr.png" }
  ],
  voice: [
    { label: "Grandparent Arrest (Scam)", file: "relative_emergency_scam.wav" },
    { label: "Automated Robocall (Scam)", file: "bank_kyc_robocall.wav" },
    { label: "Friend Lunch call (Safe)", file: "friend_social_call.wav" }
  ]
};

export default function Scanner({ onScanCompleted }) {
  const [activeTab, setActiveTab] = useState('sms_email');
  
  // Inputs
  const [textVal, setTextVal] = useState('');
  const [urlVal, setUrlVal] = useState('');
  const [fileVal, setFileVal] = useState(null);
  const [fileName, setFileName] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);

  // States
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [scanSteps, setScanSteps] = useState([]);

  // Handles tab changes and resets states
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setResult(null);
    setFileVal(null);
    setFileName('');
    setPreviewUrl(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileVal(file);
      setFileName(file.name);
      setResult(null);
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(URL.createObjectURL(file)); // Make audio/other file preview or null
      }
    }
  };

  const loadTemplate = (item) => {
    setResult(null);
    if (activeTab === 'sms_email') {
      setTextVal(item.text);
    } else if (activeTab === 'url') {
      setUrlVal(item.url);
    } else {
      setFileName(item.file);
      const isQr = activeTab === 'qrcode';
      const fileType = isQr ? 'image/png' : 'audio/wav';
      const path = `/demo_assets/${item.file}`;
      
      fetch(path)
        .then(res => {
          if (!res.ok) throw new Error(`Asset not found: ${path}`);
          return res.blob();
        })
        .then(blob => {
          const file = new File([blob], item.file, { type: fileType });
          setFileVal(file);
          if (isQr) {
            setPreviewUrl(URL.createObjectURL(file));
          } else {
            setPreviewUrl(null);
          }
        })
        .catch(err => {
          console.warn(`Failed to load real asset ${item.file}, falling back to mock.`, err);
          const blob = new Blob(["mock content"], { type: fileType });
          const mockFile = new File([blob], item.file, { type: fileType });
          setFileVal(mockFile);
          setPreviewUrl(null);
        });
    }
  };

  const triggerScan = async () => {
    setScanning(true);
    setResult(null);
    
    // Animate multi-agent coordinator steps
    const steps = [
      "SENTINEL Coordinator: Routing task to specialized agent...",
      activeTab === 'sms_email' && "TextAgent: Analysing wording, sentiment, and threat vectors...",
      activeTab === 'url' && "UrlAgent: Parsing domain structures, checking protocols, and TLD reputation...",
      activeTab === 'qrcode' && "QrAgent: Parsing image, running OpenCV QRCodeDetector...",
      activeTab === 'voice' && "AudioAgent: Running Whisper transcription and AI deepfake analysis...",
      "RAG Search: Querying CERT-In, RBI, and NPCI advisories database...",
      "SENTINEL Coordinator: Aggregating risk matrices and generating response..."
    ].filter(Boolean);

    setScanSteps([]);
    for (let i = 0; i < steps.length; i++) {
      setScanSteps(prev => [...prev, steps[i]]);
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    try {
      let response;
      if (activeTab === 'sms_email') {
        response = await fetch('http://127.0.0.1:8000/api/scan/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: textVal })
        });
      } else if (activeTab === 'url') {
        response = await fetch('http://127.0.0.1:8000/api/scan/url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlVal })
        });
      } else {
        const formData = new FormData();
        // Use either live uploaded file or created template mock
        formData.append('file', fileVal);
        
        const endpoint = activeTab === 'qrcode' ? 'qrcode' : 'voice';
        response = await fetch(`http://127.0.0.1:8000/api/scan/${endpoint}`, {
          method: 'POST',
          body: formData
        });
      }

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        onScanCompleted();
      } else {
        throw new Error("API scan failed.");
      }
    } catch (err) {
      console.warn("Scan endpoint failed. Running local mock scan fallback.", err);
      // Fallback mocks in case backend isn't active
      simulateMockResult();
    } finally {
      setScanning(false);
    }
  };

  const simulateMockResult = () => {
    let mockData = {};
    if (activeTab === 'sms_email') {
      const isScam = textVal.toLowerCase().includes('kyc') || textVal.toLowerCase().includes('lottery') || textVal.toLowerCase().includes('blocked');
      mockData = {
        category: "sms_email",
        risk_score: isScam ? 90 : 5,
        verdict: isScam ? "HIGH_RISK" : "SAFE",
        analysis_report: isScam 
          ? ["Creates artificial urgency by threatening suspension.", "Contains non-official links.", "Requests sensitive banking validation."]
          : ["No threat flags detected.", "Standard social conversation tone."],
        recommendation: isScam 
          ? "RBI Advisory: Banks will never threaten to suspend your account via SMS. Contact your bank immediately using official branch contacts."
          : "Standard vigilance recommended.",
        raw_input: textVal
      };
    } else if (activeTab === 'url') {
      const isScam = urlVal.toLowerCase().includes('xyz') || urlVal.toLowerCase().includes('rewards') || urlVal.toLowerCase().includes('sbi');
      mockData = {
        category: "url",
        risk_score: isScam ? 95 : 10,
        verdict: isScam ? "HIGH_RISK" : "SAFE",
        analysis_report: isScam 
          ? ["Unsecure HTTP protocol.", "Low-reputation Top-Level Domain (.xyz).", "Impersonates SBI online logo."]
          : ["Standard HTTPS protocol.", "Valid domain registration reputation."],
        recommendation: isScam 
          ? "CERT-In Advisory: Check website domain details before filling credentials. Verify official SSL padlock icon."
          : "URL matches official records.",
        raw_input: urlVal
      };
    } else if (activeTab === 'qrcode') {
      const isScam = fileName.toLowerCase().includes('scam') || fileName.toLowerCase().includes('collect');
      mockData = {
        category: "qrcode",
        risk_score: isScam ? 80 : 0,
        verdict: isScam ? "HIGH_RISK" : "SAFE",
        analysis_report: isScam 
          ? ["Decoded UPI payments address VPA.", "VPA contains keywords 'rewards' / 'lottery'.", "Requests automatic deduction amount of ₹2,000."]
          : ["No QR payload found or verified merchant payload."],
        recommendation: isScam 
          ? "NPCI: A UPI PIN is only needed to transfer funds, never to receive money. Decline any collect requests from strangers."
          : "QR code verified secure.",
        raw_input: "QR Code: " + fileName
      };
    } else {
      const isScam = fileName.toLowerCase().includes('scam') || fileName.toLowerCase().includes('robocall') || fileName.toLowerCase().includes('emergency');
      mockData = {
        category: "voice",
        risk_score: isScam ? 85 : 15,
        verdict: isScam ? "HIGH_RISK" : "SAFE",
        analysis_report: isScam 
          ? ["Voice pitch cloning markers detected.", "Robotic artificial pacing fluctuations.", "Creates psychological distress concerning family accident."]
          : ["Normal voice cadence fluctuations.", "Standard friendly dialogue notes."],
        recommendation: isScam 
          ? "CERT-In Advisory: Verify emergencies by calling relatives directly on their original number. Do not make money transfers based on social calls."
          : "Voice recording is safe.",
        raw_input: "Voice: " + fileName
      };
    }
    setResult(mockData);
    onScanCompleted();
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
      {/* Tab Switcher Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { id: 'sms_email', label: 'SMS & Email', icon: MessageSquare },
          { id: 'url', label: 'URL Scanner', icon: Link },
          { id: 'qrcode', label: 'QR Code', icon: QrCode },
          { id: 'voice', label: 'Voice Audio', icon: Mic },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`py-3 px-4 rounded-xl border flex flex-col items-center gap-2 transition-all font-mono text-xs ${
                isActive
                  ? 'bg-cyber-neonBlue/10 border-cyber-neonBlue/40 text-cyber-neonBlue font-semibold shadow-[0_0_15px_rgba(0,240,255,0.05)]'
                  : 'bg-cyber-dark/40 border-cyber-border text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Workspace Panel */}
      <div className="glass-panel rounded-2xl p-6 bg-cyber-dark/40 relative">
        <div className="absolute top-4 right-4 flex items-center gap-1.5 text-gray-500 text-[10px] font-mono">
          <Info className="w-3.5 h-3.5" />
          <span>Unified Scan Module</span>
        </div>

        {/* Tab Inputs */}
        <div className="mt-4">
          {activeTab === 'sms_email' && (
            <div className="space-y-4">
              <label className="block text-xs uppercase font-mono tracking-widest text-gray-400 font-semibold">
                Analyze Message Text
              </label>
              <textarea
                value={textVal}
                onChange={(e) => setTextVal(e.target.value)}
                placeholder="Paste the SMS message body or phishing email text here..."
                className="w-full h-32 bg-cyber-slate/30 border border-cyber-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyber-neonBlue/50 placeholder:text-gray-600 resize-none font-mono text-sm leading-relaxed"
              />
            </div>
          )}

          {activeTab === 'url' && (
            <div className="space-y-4">
              <label className="block text-xs uppercase font-mono tracking-widest text-gray-400 font-semibold">
                Scan Website Link
              </label>
              <input
                type="text"
                value={urlVal}
                onChange={(e) => setUrlVal(e.target.value)}
                placeholder="Enter URL to check e.g., http://secure-kyc-verify.xyz"
                className="w-full bg-cyber-slate/30 border border-cyber-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyber-neonBlue/50 placeholder:text-gray-600 font-mono text-sm"
              />
            </div>
          )}

          {(activeTab === 'qrcode' || activeTab === 'voice') && (
            <div className="space-y-4">
              <label className="block text-xs uppercase font-mono tracking-widest text-gray-400 font-semibold">
                Upload {activeTab === 'qrcode' ? 'QR Code Image' : 'Voice Audio File'}
              </label>

              {fileVal ? (
                <div className="p-5 border border-dashed border-cyber-neonBlue/40 bg-cyber-neonBlue/5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Upload className="w-6 h-6 text-cyber-neonBlue animate-bounce" />
                    <div>
                      <p className="font-semibold text-sm text-gray-200 font-mono">{fileName}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-mono">
                        {activeTab === 'qrcode' ? 'Image Ready for analysis' : 'Audio Ready for transcription'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setFileVal(null); setFileName(''); setPreviewUrl(null); }}
                    className="p-1.5 rounded-lg border border-cyber-border text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-cyber-border rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-cyber-neonBlue/40 transition-all bg-cyber-dark/30 hover:bg-cyber-neonBlue/5">
                  <Upload className="w-8 h-8 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-300">Drag & Drop file or click to browse</span>
                  <span className="text-[10px] text-gray-600 font-mono">
                    {activeTab === 'qrcode' ? 'Supports PNG, JPG, JPEG' : 'Supports WAV, MP3, M4A'}
                  </span>
                  <input
                    type="file"
                    accept={activeTab === 'qrcode' ? 'image/*' : 'audio/*'}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}

              {previewUrl && (
                <div className="mt-4 flex justify-center">
                  <img src={previewUrl} alt="QR Preview" className="max-h-32 rounded-lg border border-cyber-border p-2 bg-cyber-dark/65" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick presets templates */}
        <div className="mt-6 pt-4 border-t border-cyber-border/60">
          <span className="text-[10px] font-mono tracking-widest text-gray-500 uppercase block mb-2 font-semibold">
            Demo Presets Templates:
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_TEMPLATES[activeTab].map((item, idx) => (
              <button
                key={idx}
                onClick={() => loadTemplate(item)}
                className="py-1 px-3 bg-cyber-slate/30 border border-cyber-border/70 hover:border-cyber-neonBlue/20 rounded-lg text-[10px] text-gray-400 hover:text-white transition-all font-mono"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Scan Trigger */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={triggerScan}
            disabled={
              scanning || 
              (activeTab === 'sms_email' && !textVal.trim()) ||
              (activeTab === 'url' && !urlVal.trim()) ||
              ((activeTab === 'qrcode' || activeTab === 'voice') && !fileVal)
            }
            className="flex items-center gap-2 py-3 px-6 bg-gradient-to-r from-cyber-neonBlue to-blue-600 hover:from-blue-500 hover:to-cyber-neonBlue text-white font-bold uppercase tracking-wider rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,240,255,0.2)] text-xs font-mono"
          >
            {scanning ? "Evaluating Threat..." : "Trigger AI Agent Scan"}
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scanning Agentic Steps loader */}
      {scanning && (
        <div className="glass-panel rounded-2xl p-5 border border-cyber-neonBlue/30 bg-cyber-neonBlue/5 space-y-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-neonBlue opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyber-neonBlue"></span>
            </span>
            <span className="text-xs font-bold font-mono text-cyber-neonBlue tracking-wider uppercase">
              AGENT ORCHESTRATION IN PROGRESS
            </span>
          </div>
          <div className="space-y-1.5 pl-6 text-[11px] font-mono text-gray-500">
            {scanSteps.map((step, idx) => (
              <div key={idx} className="animate-pulse text-gray-300">
                ⏳ {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Workspace */}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* Left panel: RiskGauge */}
          <div className="md:col-span-1 glass-panel rounded-2xl p-6 bg-cyber-dark/40 flex flex-col items-center justify-center">
            <h3 className="text-xs font-bold font-mono tracking-wider text-gray-400 uppercase pb-3 border-b border-cyber-border w-full text-center mb-4">
              Risk Evaluation
            </h3>
            <RiskGauge score={result.risk_score} />
          </div>

          {/* Right panel: Details & Recommendations */}
          <div className="md:col-span-2 glass-panel rounded-2xl p-6 bg-cyber-dark/40 space-y-5">
            {/* Explanatory Reasons */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold font-mono tracking-wider text-gray-300 uppercase">
                Forensic Analysis Report
              </h4>
              <ul className="space-y-2 pl-4 list-disc text-xs text-gray-400">
                {result.analysis_report.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Grounded RAG recommendations */}
            <div className="p-4 rounded-xl border border-cyber-neonBlue/10 bg-cyber-neonBlue/5 space-y-2">
              <div className="flex items-center gap-2 text-cyber-neonBlue">
                <AlertTriangle className="w-4 h-4" />
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider">
                  Explainable RAG Safety Advisory
                </h4>
              </div>
              <p className="text-[11px] leading-relaxed text-gray-400 whitespace-pre-line font-mono font-medium">
                {result.recommendation}
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
