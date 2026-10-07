import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';

const SUGGESTED_CHIPS = [
  "Is a UPI PIN required to receive money?",
  "What is the official rule for KYC block messages?",
  "How can I recognize fake Telegram jobs?",
  "What should I do if I get scammed online?"
];

export default function GuardChat() {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! I am your SENTINEL Cybersecurity Advisor. I retrieve verified guidelines from official databases (RBI, CERT-In, NPCI) to help protect you from financial fraud and phishing. Ask me anything about suspicious calls, UPI payments, messages, or link alerts.",
      sources: []
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const queryText = textToSend || inputVal;
    if (!queryText.trim()) return;

    // Add user message
    const userMsg = { sender: 'user', text: queryText };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setLoading(true);

    // Format chat history for RAG API
    const history = messages.slice(1).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: msg.text
    }));

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: queryText,
          history: history
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: data.answer,
          sources: data.sources
        }]);
      } else {
        throw new Error("Chat service failed");
      }
    } catch (err) {
      console.warn("Failed to contact chat server. Running offline fallback.", err);
      // Fallback mocks
      setTimeout(() => {
        simulateOfflineResponse(queryText);
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const simulateOfflineResponse = (query) => {
    let answer = "";
    let sources = [];
    const q = query.toLowerCase();

    if (q.includes('pin') || q.includes('upi') || q.includes('receive')) {
      answer = "NPCI Safety Guidelines: You NEVER need to enter your UPI PIN or scan a QR code to receive money. UPI PIN is solely required to deduct/transfer money from your account. If someone asks you to enter your PIN to receive a prize or payment, decline it immediately.";
      sources = ["NPCI (National Payments Corporation of India)"];
    } else if (q.includes('kyc') || q.includes('block') || q.includes('bank')) {
      answer = "RBI Advisory: Banks will never threaten account suspension or credit card blocks via SMS, nor will they ask you for netbanking passwords, OTPs, or debit card PINs over call or links. Ignore KYC messages containing shortened links (e.g., bit.ly) or non-official domains.";
      sources = ["RBI (Reserve Bank of India)"];
    } else if (q.includes('job') || q.includes('telegram') || q.includes('part-time')) {
      answer = "RBI Warning on Ponzi Schemes: Watch out for 'part-time video liking jobs' or telegram investment tasks that promise high daily returns. They often ask you to deposit money to 'unlock tasks'. These are 100% investment scams. Do not send deposits to unknown entities.";
      sources = ["RBI (Reserve Bank of India)"];
    } else {
      answer = "CERT-In Cyber Guide: If you suspect a scam or have lost money, immediately register a complaint on the National Cyber Crime portal (cybercrime.gov.in) or call the toll-free helpline number 1930 within the golden hour (first 2 hours) to freeze transaction transfers.";
      sources = ["CERT-In (Indian Computer Emergency Response Team)"];
    }

    setMessages(prev => [...prev, { sender: 'bot', text: answer, sources }]);
  };

  return (
    <div className="flex flex-col h-[520px] max-w-3xl mx-auto glass-panel rounded-2xl bg-cyber-dark/40 overflow-hidden">
      
      {/* Header */}
      <div className="p-4 border-b border-cyber-border/80 flex items-center justify-between bg-cyber-dark/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-cyber-neonBlue/10 border border-cyber-neonBlue/20 rounded-xl">
            <Bot className="w-5 h-5 text-cyber-neonBlue animate-pulse-slow" />
          </div>
          <div>
            <h3 className="font-bold text-sm font-mono tracking-wider text-gray-200">
              SENTINEL ADVISOR
            </h3>
            <span className="text-[9px] font-mono text-cyber-neonGreen flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-cyber-neonGreen animate-ping"></span>
              RAG-Grounded AI Active
            </span>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 scroll-smooth">
        {messages.map((msg, idx) => (
          <div 
            key={idx}
            className={`flex items-start gap-3 max-w-[85%] ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            {/* Icon avatar */}
            <div className={`p-2 rounded-xl border ${
              msg.sender === 'user' 
                ? 'bg-cyber-slate/60 border-cyber-border text-gray-300' 
                : 'bg-cyber-neonBlue/10 border-cyber-neonBlue/20 text-cyber-neonBlue'
            }`}>
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble content */}
            <div className={`p-3.5 rounded-2xl space-y-2 border text-xs leading-relaxed ${
              msg.sender === 'user'
                ? 'bg-cyber-slate/40 border-cyber-border text-gray-200 rounded-tr-none'
                : 'bg-cyber-dark/60 border-cyber-border/80 text-gray-300 rounded-tl-none'
            }`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
              
              {/* Citations / Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 mt-2 border-t border-cyber-border/40 text-[9px] font-mono text-gray-500">
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3 text-cyber-neonBlue" /> Verification sources:</span>
                  {msg.sources.map((src, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-cyber-dark border border-cyber-border text-cyber-neonBlue">
                      {src}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-3 max-w-[85%]">
            <div className="p-2 rounded-xl border bg-cyber-neonBlue/10 border-cyber-neonBlue/20 text-cyber-neonBlue animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl border bg-cyber-dark/60 border-cyber-border/80 rounded-tl-none flex items-center gap-1.5 text-xs text-gray-500 font-mono">
              <span className="w-1.5 h-1.5 bg-cyber-neonBlue rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-cyber-neonBlue rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-cyber-neonBlue rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              <span>Querying Cybersecurity Advisories...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef}></div>
      </div>

      {/* Input panel & Suggested chips */}
      <div className="p-4 border-t border-cyber-border bg-cyber-dark/65 space-y-3">
        {/* Chips */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                className="py-1 px-2.5 bg-cyber-slate/30 border border-cyber-border rounded-lg text-[10px] text-gray-400 hover:text-cyber-neonBlue hover:border-cyber-neonBlue/30 transition-all font-mono"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* TextInput Box */}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your security question here e.g. KYC warning safety..."
            className="flex-1 bg-cyber-slate/30 border border-cyber-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyber-neonBlue/50 placeholder:text-gray-600 text-xs font-mono"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputVal.trim() || loading}
            className="p-2.5 bg-gradient-to-r from-cyber-neonBlue to-blue-600 hover:from-blue-500 hover:to-cyber-neonBlue rounded-xl text-white transition-all disabled:opacity-45"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
