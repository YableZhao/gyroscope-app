import { useState, useEffect, useCallback } from 'react';
import type { GyroscopeData, FilteredGyroscopeData, PermissionState } from '../types';

interface UseGyroscopeOptions {
  smoothingFactor?: number;
  permission: PermissionState;
}

interface UseGyroscopeReturn {
  data: FilteredGyroscopeData;
  rawData: GyroscopeData;
  setSmoothingFactor: (factor: number) => void;
  smoothingFactor: number;
  reset: () => void;
}

export const useGyroscope = ({ 
  smoothingFactor: initialSmoothingFactor = 10, 
  permission 
}: UseGyroscopeOptions): UseGyroscopeReturn => {
  const [rawData, setRawData] = useState<GyroscopeData>({
    alpha: 0,
    beta: 0,
    gamma: 0
  });

  const [smoothingFactor, setSmoothingFactor] = useState(initialSmoothingFactor);
  const [history, setHistory] = useState<GyroscopeData[]>([]);

  // Calculate filtered data using moving average
  const filteredData: FilteredGyroscopeData = {
    alpha: history.length > 0 ? history.reduce((sum, data) => sum + data.alpha, 0) / history.length : 0,
    beta: history.length > 0 ? history.reduce((sum, data) => sum + data.beta, 0) / history.length : 0,
    gamma: history.length > 0 ? history.reduce((sum, data) => sum + data.gamma, 0) / history.length : 0,
    timestamp: Date.now()
  };

  // Adjust for screen orientation
  const getAdjustedData = useCallback((data: GyroscopeData): GyroscopeData => {
    let { alpha, beta, gamma } = data;
    
    switch (window.orientation) {
      case 90:
        [beta, gamma] = [-gamma, beta];
        break;
      case -90:
        [beta, gamma] = [gamma, -beta];
        break;
      case 180:
        [beta, gamma] = [-beta, -gamma];
        break;
      default:
        break;
    }
    
    return { alpha, beta, gamma };
  }, []);

  const handleOrientationChange = useCallback((event: DeviceOrientationEvent) => {
    if (permission !== 'granted') return;

    const adjustedData = getAdjustedData({
      alpha: event.alpha || 0,
      beta: event.beta || 0,
      gamma: event.gamma || 0
    });

    setRawData(adjustedData);
  }, [permission, getAdjustedData]);

  const reset = useCallback(() => {
    setRawData({ alpha: 0, beta: 0, gamma: 0 });
    setHistory([]);
  }, []);

  // Update history when raw data changes
  useEffect(() => {
    setHistory(prev => [rawData, ...prev].slice(0, smoothingFactor));
  }, [rawData, smoothingFactor]);

  // Set up device orientation listener
  useEffect(() => {
    if (!window.DeviceOrientationEvent || permission !== 'granted') {
      return;
    }

    window.addEventListener('deviceorientation', handleOrientationChange);
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientationChange);
    };
  }, [handleOrientationChange, permission]);

  return {
    data: filteredData,
    rawData,
    setSmoothingFactor,
    smoothingFactor,
    reset
  };
};