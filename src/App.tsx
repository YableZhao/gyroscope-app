import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useOrientationPermission } from './hooks/useOrientationPermission';
import { useGyroscope } from './hooks/useGyroscope';
import { OverseerContextProvider, useOverseerContext } from './contexts/OverseerContext';
import { UserContextProvider } from './contexts/UserContext';
import { Board } from './components/Board';
import type { UserData } from './types';

// 3D Cube component from original app (enhanced)
interface CubeProps {
  alpha: number;
  beta: number;
  gamma: number;
}

const Cube: React.FC<CubeProps> = ({ alpha, beta, gamma }) => {
  return (
    <mesh rotation={[beta * Math.PI / 180, gamma * Math.PI / 180, alpha * Math.PI / 180]}>
      <boxGeometry args={[2, 4, 0.5]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
};

// Client component that manages local gyroscope data
const ClientController: React.FC = () => {
  const { permission, requestPermission } = useOrientationPermission();
  const { data, rawData, setSmoothingFactor, smoothingFactor, reset } = useGyroscope({ 
    permission,
    smoothingFactor: 10
  });
  const { addUser, removeUser, update } = useOverseerContext();

  // Create and manage client user
  useEffect(() => {
    const clientUser: UserData = {
      username: 'client',
      alpha: data.alpha,
      beta: data.beta,
      gamma: data.gamma,
      update: (vals) => {
        update(vals, 'client');
      }
    };

    addUser(clientUser);

    return () => {
      removeUser('client');
    };
  }, [addUser, removeUser]);

  // Update client data when gyroscope changes
  useEffect(() => {
    update({
      alpha: data.alpha,
      beta: data.beta,
      gamma: data.gamma
    }, 'client');
  }, [data.alpha, data.beta, data.gamma, update]);

  // 2D dot position calculation (from original app)
  const dotPosition = {
    x: 50 + data.beta,
    y: 50 + data.gamma
  };

  const buttonStyle = {
    backgroundColor: permission === 'granted' ? '#668fac' : '#ffd24d',
    borderRadius: '12px',
    padding: '10px',
    border: 'none',
    cursor: 'pointer'
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4 bg-gray-100">
      {/* Permission Button */}
      <button onClick={requestPermission} style={buttonStyle}>
        {permission === 'granted' ? 'Revoke' : 'Grant'} permission to access motion and orientation
      </button>

      {/* Multi-user Board */}
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-center">Multi-User Gyroscope Board</h2>
        <Board className="mx-auto" />
      </div>

      {/* Original 2D Visualization */}
      <div 
        className="relative bg-blue-900 border border-gray-300"
        style={{ width: '200px', height: '200px' }}
      >
        <div className="absolute top-1/2 left-0 w-full h-px bg-black" />
        <div className="absolute top-0 left-1/2 w-px h-full bg-black" />
        <div 
          className="absolute w-2.5 h-2.5 bg-yellow-400 rounded-full"
          style={{
            left: `${dotPosition.x}%`,
            top: `${dotPosition.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        />
      </div>

      {/* 3D Visualization */}
      <div className="w-64 h-64 bg-white rounded-lg shadow-lg overflow-hidden">
        <Canvas>
          <ambientLight />
          <pointLight position={[10, 10, 10]} />
          <Cube alpha={data.alpha} beta={data.beta} gamma={data.gamma} />
        </Canvas>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
        {/* Alpha Controls */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Alpha: {Math.round(data.alpha)}°</label>
          <input 
            type="range" 
            min="0" 
            max="360" 
            value={rawData.alpha}
            onChange={(e) => update({ alpha: parseFloat(e.target.value) }, 'client')}
            className="w-full"
          />
        </div>
        <input 
          type="number" 
          min="0" 
          max="360" 
          value={Math.round(rawData.alpha)}
          onChange={(e) => update({ alpha: parseFloat(e.target.value) }, 'client')}
          className="border rounded px-2 py-1"
        />

        {/* Beta Controls */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Beta: {Math.round(data.beta)}°</label>
          <input 
            type="range" 
            min="-180" 
            max="180" 
            value={rawData.beta}
            onChange={(e) => update({ beta: parseFloat(e.target.value) }, 'client')}
            className="w-full"
          />
        </div>
        <input 
          type="number" 
          min="-180" 
          max="180" 
          value={Math.round(rawData.beta)}
          onChange={(e) => update({ beta: parseFloat(e.target.value) }, 'client')}
          className="border rounded px-2 py-1"
        />

        {/* Gamma Controls */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Gamma: {Math.round(data.gamma)}°</label>
          <input 
            type="range" 
            min="-180" 
            max="180" 
            value={rawData.gamma}
            onChange={(e) => update({ gamma: parseFloat(e.target.value) }, 'client')}
            className="w-full"
          />
        </div>
        <input 
          type="number" 
          min="-180" 
          max="180" 
          value={Math.round(rawData.gamma)}
          onChange={(e) => update({ gamma: parseFloat(e.target.value) }, 'client')}
          className="border rounded px-2 py-1"
        />

        {/* Smoothing Controls */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Smoothing: {smoothingFactor}</label>
          <input 
            type="range" 
            min="1" 
            max="100" 
            value={smoothingFactor}
            onChange={(e) => setSmoothingFactor(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
        <input 
          type="number" 
          min="1" 
          max="100" 
          value={smoothingFactor}
          onChange={(e) => setSmoothingFactor(parseInt(e.target.value))}
          className="border rounded px-2 py-1"
        />
      </div>

      {/* Reset Button */}
      <button 
        onClick={reset}
        className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
      >
        Reset
      </button>
    </div>
  );
};

// Wrapper component to pass overseer context to user context
const AppContent: React.FC = () => {
  const overseerContext = useOverseerContext();
  
  return (
    <UserContextProvider value={overseerContext}>
      <ClientController />
    </UserContextProvider>
  );
};

// Main App with context providers
const App: React.FC = () => {
  return (
    <OverseerContextProvider>
      <AppContent />
    </OverseerContextProvider>
  );
};

export default App;