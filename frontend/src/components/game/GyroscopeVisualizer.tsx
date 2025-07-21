"use client"

import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { GyroscopeData } from '@/types'

interface CubeProps {
  gyroData: GyroscopeData
}

function Cube({ gyroData }: CubeProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (meshRef.current) {
      // Convert degrees to radians and apply rotation
      meshRef.current.rotation.x = (gyroData.beta * Math.PI) / 180
      meshRef.current.rotation.y = (gyroData.gamma * Math.PI) / 180
      meshRef.current.rotation.z = (gyroData.alpha * Math.PI) / 180
    }
  })

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 4, 0.5]} />
      <meshStandardMaterial color="#ff6b35" />
    </mesh>
  )
}

interface GyroscopeVisualizerProps {
  gyroData: GyroscopeData
  className?: string
  showAxes?: boolean
}

export function GyroscopeVisualizer({ 
  gyroData, 
  className = '',
  showAxes = true 
}: GyroscopeVisualizerProps) {
  // Simplified axes for now - will enhance later
  const AxesHelper = showAxes ? (
    <primitive object={new THREE.AxesHelper(3)} />
  ) : null

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      <Canvas camera={{ position: [5, 5, 5], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        
        <Cube gyroData={gyroData} />
        {AxesHelper}
      </Canvas>
      
      {/* Data overlay */}
      <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs p-2 rounded">
        <div>α: {gyroData.alpha.toFixed(1)}°</div>
        <div>β: {gyroData.beta.toFixed(1)}°</div>
        <div>γ: {gyroData.gamma.toFixed(1)}°</div>
      </div>
    </div>
  )
}