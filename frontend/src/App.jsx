import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import GuardChat from './pages/GuardChat';
import ThreatMap from './pages/ThreatMap';
import ScamReporter from './components/ScamReporter';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [isReporterOpen, setIsReporterOpen] = useState(false);
  const [refreshStats, setRefreshStats] = useState(0);

  const handleStatsTrigger = () => {
    // Increment counter to trigger useEffects in child components
    setRefreshStats(prev => prev + 1);
  };

  return (
    <div className="relative">
      <Layout 
        activePage={activePage} 
        setActivePage={setActivePage}
        onOpenReporter={() => setIsReporterOpen(true)}
      >
        {activePage === 'dashboard' && (
          <Dashboard triggerRefreshStats={refreshStats} />
        )}
        {activePage === 'scanner' && (
          <Scanner onScanCompleted={handleStatsTrigger} />
        )}
        {activePage === 'chat' && (
          <GuardChat />
        )}
        {activePage === 'threats' && (
          <ThreatMap triggerRefreshStats={refreshStats} />
        )}
      </Layout>

      {/* Floating Global Modal for reporting scams */}
      <ScamReporter 
        isOpen={isReporterOpen} 
        onClose={() => setIsReporterOpen(false)}
        onReportSubmitted={handleStatsTrigger}
      />
    </div>
  );
}
