import React from 'react';
import { Shield, LayoutDashboard, Scan, MessageSquare, AlertTriangle, Radio } from 'lucide-react';

export default function Layout({ children, activePage, setActivePage, onOpenReporter }) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'scanner', name: 'Scam Scanner', icon: Scan },
    { id: 'chat', name: 'Guard Chat', icon: MessageSquare },
    { id: 'threats', name: 'Threat Feed', icon: Radio },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-cyber-bg cyber-grid-bg">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-cyber-dark/80 border-b md:border-b-0 md:border-r border-cyber-border flex flex-col justify-between p-4 md:p-6 backdrop-blur-xl md:sticky md:top-0 md:h-screen z-20">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 md:mb-12">
            <div className="p-2.5 bg-cyber-neonBlue/10 border border-cyber-neonBlue/30 rounded-xl relative group">
              <Shield className="w-6 h-6 text-cyber-neonBlue animate-pulse-slow" />
              <div className="absolute inset-0 bg-cyber-neonBlue/20 rounded-xl blur filter opacity-30 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-white via-gray-300 to-cyber-neonBlue bg-clip-text text-transparent">
                SENTINEL
              </h1>
              <span className="text-[10px] text-cyber-neonBlue font-mono uppercase tracking-widest block glow-text-blue">
                AI Cyber Guard
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium ${
                    isActive
                      ? 'bg-cyber-neonBlue/10 border border-cyber-neonBlue/20 text-cyber-neonBlue shadow-[0_0_15px_rgba(0,240,255,0.07)]'
                      : 'text-gray-400 border border-transparent hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-cyber-neonBlue' : 'text-gray-400'}`} />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Action Button & System Health status */}
        <div className="mt-8 md:mt-0 space-y-4">
          <button
            onClick={onOpenReporter}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-cyber-neonRed to-pink-600 hover:from-pink-500 hover:to-cyber-neonRed text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,0,127,0.3)] border border-cyber-neonRed/20"
          >
            <AlertTriangle className="w-4 h-4 animate-bounce" />
            Report A Scam
          </button>

          <div className="pt-4 border-t border-cyber-border/60 flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-neonGreen opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyber-neonGreen"></span>
            </span>
            <span className="text-[11px] font-mono text-gray-500 tracking-wider">
              AGENT NETWORK ONLINE
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-cyber-border bg-cyber-dark/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold tracking-wider text-gray-400 uppercase">
              {activePage === 'dashboard' && 'Security Dashboard'}
              {activePage === 'scanner' && 'Threat Scanner Workspace'}
              {activePage === 'chat' && 'Cybersecurity Guard Chat'}
              {activePage === 'threats' && 'Threat Intelligence Feed'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {/* System Info */}
            <div className="hidden sm:flex items-center gap-2 py-1 px-3 bg-cyber-slate/50 border border-cyber-border rounded-lg text-xs font-mono text-gray-400">
              <span className="text-cyber-neonBlue">GATEWAY:</span>
              <span>127.0.0.1:8000</span>
            </div>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
