import React from 'react';

export const Logo = ({ className = "w-8 h-8" }: { className?: string }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="omniGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="omniGrad2" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#4338CA" />
        </linearGradient>
      </defs>
      
      {/* Omni Loop - representing continuous flow and all-encompassing management */}
      <path 
        d="M 30,50 C 30,30 50,30 50,50 C 50,70 70,70 70,50 C 70,30 50,30 50,50 C 50,70 30,70 30,50 Z" 
        stroke="url(#omniGrad1)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Central Spark/Data point representing insight */}
      <circle cx="50" cy="50" r="6" fill="url(#omniGrad2)" />
      
      {/* Outer bounding elements for 'Gestão' (structure/management) */}
      <path
        d="M 15,25 L 25,15"
        stroke="url(#omniGrad2)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M 85,75 L 75,85"
        stroke="url(#omniGrad2)"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
};
