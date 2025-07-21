import React from 'react';
import { useUserContext } from '../contexts/UserContext';
import { Dot } from './Dot';
import type { BoardProps, Position } from '../types';

const BOARD_SIZE = 512;
const CIRCLE_DEGREES = 360;

export const Board: React.FC<BoardProps> = ({ className = '' }) => {
  const { users, timestamp } = useUserContext();

  const getPosition = (user: any): Position => {
    return {
      x: ((user.gamma + CIRCLE_DEGREES / 2) % CIRCLE_DEGREES) / CIRCLE_DEGREES * BOARD_SIZE,
      y: ((user.beta + CIRCLE_DEGREES / 2) % CIRCLE_DEGREES) / CIRCLE_DEGREES * BOARD_SIZE,
      alpha: user.alpha
    };
  };

  return (
    <div 
      className={`relative bg-blue-900 border border-gray-300 ${className}`}
      style={{ width: BOARD_SIZE, height: BOARD_SIZE }}
    >
      {/* Grid lines */}
      <div className="absolute top-1/2 left-0 w-full h-px bg-gray-400 opacity-50" />
      <div className="absolute top-0 left-1/2 w-px h-full bg-gray-400 opacity-50" />
      
      {/* Render all user dots */}
      {Array.from(users.values()).map((user) => (
        <Dot
          key={user.username}
          username={`${user.username} (${Math.round(user.gamma)}, ${Math.round(user.beta)}, ${Math.round(user.alpha)})`}
          position={getPosition(user)}
        />
      ))}
      
      {/* Timestamp display */}
      <div className="absolute bottom-2 left-2 text-xs text-white bg-black bg-opacity-70 px-2 py-1 rounded">
        {timestamp}
      </div>
    </div>
  );
};