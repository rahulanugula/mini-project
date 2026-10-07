import React, { useEffect, useState } from 'react';

export default function RiskGauge({ score }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Reset and animate the risk meter value
    setAnimatedScore(0);
    const duration = 1000; // 1s animation
    const steps = 60;
    const increment = score / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(increment * currentStep));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  // Determine colors based on score
  const getVerdict = (val) => {
    if (val >= 70) return { label: 'HIGH RISK', color: 'text-cyber-neonRed', stroke: '#ff007f', shadow: 'rgba(255, 0, 127, 0.4)' };
    if (val >= 25) return { label: 'SUSPICIOUS', color: 'text-amber-500', stroke: '#f59e0b', shadow: 'rgba(245, 158, 11, 0.4)' };
    return { label: 'CLEAN / SAFE', color: 'text-cyber-neonGreen', stroke: '#39ff14', shadow: 'rgba(57, 255, 20, 0.4)' };
  };

  const verdict = getVerdict(score);

  // SVG parameters
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-44 h-44 flex items-center justify-center">
        {/* Glowing shadow ring behind circle */}
        <div 
          className="absolute w-36 h-36 rounded-full opacity-10 blur-xl transition-all duration-500"
          style={{ backgroundColor: verdict.stroke }}
        ></div>

        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle track */}
          <circle
            cx="88"
            cy="88"
            r={radius}
            stroke="rgba(255,255,255,0.03)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated active track */}
          <circle
            cx="88"
            cy="88"
            r={radius}
            stroke={verdict.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: 'stroke-dashoffset 0.1s ease-out',
              filter: `drop-shadow(0 0 4px ${verdict.stroke})`
            }}
          />
        </svg>

        {/* Center label */}
        <div className="absolute text-center">
          <span className="text-4xl font-extrabold font-mono tracking-tight block">
            {animatedScore}%
          </span>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono font-semibold block mt-0.5">
            Threat Score
          </span>
        </div>
      </div>

      <div className="mt-4 text-center">
        <h4 className={`text-base font-extrabold tracking-wider uppercase font-mono ${verdict.color}`}>
          {verdict.label}
        </h4>
      </div>
    </div>
  );
}
