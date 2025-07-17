
'use client';

import React from 'react';
import { BrainCircuit } from 'lucide-react';

export function AnimatedLogo() {
  return (
    <div className="relative w-full max-w-[400px] aspect-square flex items-center justify-center">
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Main Brain Shape */}
        <path
          className="animated-logo-brain"
          d="M 50,20 C 25,20 20,40 20,50 C 20,60 25,80 50,80 C 75,80 80,60 80,50 C 80,40 75,20 50,20 Z M 50,25 C 60,25 65,35 65,45 C 65,55 60,65 50,65 C 40,65 35,55 35,45 C 35,35 40,25 50,25 Z"
          fill="hsl(var(--primary) / 0.1)"
          stroke="hsl(var(--primary) / 0.5)"
          strokeWidth="1"
        />

        {/* Circuit Paths */}
        <path
          d="M20 50 Q 35 35, 50 25"
          fill="none"
          stroke="hsl(var(--primary) / 0.7)"
          strokeWidth="1.5"
          strokeDasharray="2 2"
          className="animate-pulse"
          style={{ animationDuration: '4s' }}
        />
        <path
          d="M80 50 Q 65 65, 50 75"
          fill="none"
          stroke="hsl(var(--primary) / 0.7)"
          strokeWidth="1.5"
          strokeDasharray="2 2"
          className="animate-pulse"
          style={{ animationDuration: '4s', animationDelay: '1s' }}
        />
        <path
          d="M35 45 C 40 55, 60 55, 65 45"
          fill="none"
          stroke="hsl(var(--primary) / 0.7)"
          strokeWidth="1.5"
           className="animate-pulse"
          style={{ animationDuration: '3s' }}
        />

        {/* Nodes */}
        <circle className="animated-logo-spark" cx="20" cy="50" r="4" fill="hsl(var(--primary))" filter="url(#glow)" />
        <circle className="animated-logo-spark" cx="80" cy="50" r="4" fill="hsl(var(--primary))" filter="url(#glow)" />
        <circle className="animated-logo-spark" cx="50" cy="25" r="4" fill="hsl(var(--primary))" filter="url(#glow)" />
        <circle className="animated-logo-spark" cx="50" cy="75" r="4" fill="hsl(var(--primary))" filter="url(#glow)" />
        <circle className="animated-logo-spark" cx="35" cy="45" r="4" fill="hsl(var(--primary))" filter="url(#glow)" />
        <circle className="animated-logo-spark" cx="65" cy="45" r="4" fill="hsl(var(--primary))" filter="url(#glow)" />
      </svg>
    </div>
  );
}
