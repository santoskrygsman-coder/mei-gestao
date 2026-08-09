import React from 'react';

export const Logo = ({ className = "w-8 h-8" }: { className?: string }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="omniGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
        <linearGradient id="omniGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      
      {/* Outer Hexagon/Polygon base to give it a solid, structural feel */}
      <path 
        d="M20 2L35.5885 11V29L20 38L4.41154 29V11L20 2Z" 
        fill="url(#omniGrad1)" 
        fillOpacity="0.1"
      />
      
      {/* Core "O" shape representing Omni (all-encompassing) with dynamic overlapping paths */}
      <path 
        d="M20 7C12.8203 7 7 12.8203 7 20C7 27.1797 12.8203 33 20 33C27.1797 33 33 27.1797 33 20"
        stroke="url(#omniGrad1)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      
      <path 
        d="M20 33C27.1797 33 33 27.1797 33 20C33 12.8203 27.1797 7 20 7"
        stroke="url(#omniGrad2)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="40 100"
        strokeDashoffset="10"
      />
      
      {/* Central connection point representing Gestão (control/center) */}
      <circle cx="20" cy="20" r="4" fill="url(#omniGrad2)" />
    </svg>
  );
};
