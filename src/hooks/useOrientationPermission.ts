import { useState, useEffect } from 'react';
import type { PermissionState } from '../types';

interface UseOrientationPermissionReturn {
  permission: PermissionState;
  requestPermission: () => Promise<void>;
}

export const useOrientationPermission = (): UseOrientationPermissionReturn => {
  const [permission, setPermission] = useState<PermissionState>('default');

  useEffect(() => {
    // Check if permission is required (iOS Safari)
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      // Permission required - start with default state
      setPermission('default');
    } else {
      // Permission not required - assume granted
      setPermission('granted');
    }
  }, []);

  const requestPermission = async (): Promise<void> => {
    if (permission === 'granted') {
      // Toggle off - reset to default
      setPermission('default');
      return;
    }

    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        setPermission(permissionState as PermissionState);
      } catch (error) {
        console.error('Failed to request device orientation permission:', error);
        setPermission('denied');
      }
    } else {
      // Browser doesn't require permission
      setPermission('granted');
    }
  };

  return { permission, requestPermission };
};