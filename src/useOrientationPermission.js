// useOrientationPermission.js
import { useState, useEffect } from 'react';

const useOrientationPermission = () => {
  const [permission, setPermission] = useState('default'); // 'default', 'granted', or 'denied'

  useEffect(() => {
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(permissionState => {
          setPermission(permissionState);
        })
        .catch(console.error);
    } else {
      setPermission('granted'); // assume granted by default on browsers that don't require permission
    }
  }, []);

  const requestPermission = async () => {
    if (permission === 'granted') {
      setPermission('default');
    } else {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const permissionState = await DeviceOrientationEvent.requestPermission();
        setPermission(permissionState);
      } else {
        setPermission('granted');
      }
    }
  };

  return { permission, requestPermission };
};

export default useOrientationPermission;
