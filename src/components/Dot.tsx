import React from 'react';
import type { DotProps } from '../types';

export const Dot: React.FC<DotProps> = ({ 
  className = '', 
  username, 
  position 
}) => {
  const { x, y, alpha } = position;

  return (
    <div
      className={`absolute z-10 ${className}`}
      style={{
        left: `${x - 4}px`,
        top: `${y - 4}px`,
      }}
    >
      {/* Main dot */}
      <div 
        className="w-2 h-2 bg-yellow-400 rounded-full shadow-lg"
        style={{ 
          transform: `rotate(${alpha + 225}deg)` 
        }}
      />
      
      {/* Username label */}
      <div className="absolute top-3 left-1/2 transform -translate-x-1/2 text-xs text-white bg-black bg-opacity-70 px-1 rounded whitespace-nowrap">
        {username}
      </div>
    </div>
  );
};