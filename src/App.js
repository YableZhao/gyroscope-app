import React, { useEffect, useState } from 'react';
import useOrientationPermission from './useOrientationPermission';

function App() {
  const { permission, requestPermission } = useOrientationPermission();

  const [alpha, setAlpha] = useState(0);
  const [beta, setBeta] = useState(0);
  const [gamma, setGamma] = useState(0);
  const [smoothingFactor, setSmoothingFactor] = useState(0); // Add a state for smoothingFactor

  const handleReset = () => {
    setAlpha(0);
    setBeta(0);
    setGamma(0);
    setSmoothingFactor(0); // Reset smoothingFactor to default value
  };
  useEffect(() => {
    const handleOrientation = (event) => {
      if (permission === 'granted') {
        setAlpha(event.alpha);
        setBeta(event.beta);
        setGamma(event.gamma);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    } else {
      console.log("Sorry, your browser doesn't support Device Orientation");
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [permission]);

  let betaAdjusted = beta;
  let gammaAdjusted = gamma;

  switch (window.orientation) {
    case 90:
      [betaAdjusted, gammaAdjusted] = [-gammaAdjusted, betaAdjusted];
      break;
    case -90:
      [betaAdjusted, gammaAdjusted] = [gammaAdjusted, -betaAdjusted];
      break;
    case 180:
      [betaAdjusted, gammaAdjusted] = [-betaAdjusted, -gammaAdjusted];
      break;
    default:
      break;
  }

  let smoothedBeta = 0;
  let smoothedGamma = 0;  // closer to 1 = more smoothing, closer to 0 = less smoothing
  
  smoothedBeta = smoothingFactor * smoothedBeta + (1 - smoothingFactor) * betaAdjusted;
  smoothedGamma = smoothingFactor * smoothedGamma + (1 - smoothingFactor) * gammaAdjusted;
  const dotStyle = {
    position: 'relative',
    top: `${50 + smoothedBeta}%`,
    left: `${50 + smoothedGamma}%`,
    width: '10px',
    height: '10px',
    backgroundColor: "#ffcb05",
    borderRadius: '50%',
  };

  return (
    <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '20px'}}>
      <h1 style={{margin: '0'}}>Status</h1>
      <button 
        onClick={requestPermission} 
        style={{backgroundColor: permission === 'granted' ? '#668fac' : '#ffd24d', borderRadius: '12px', padding: '10px', border: 'none', cursor: 'pointer'}}
      >
        {permission === 'granted' ? 'Revoke' : 'Grant'} permission to access motion and orientation
      </button>
      <div style={{position: 'relative', width: '90vw', height: '50vh', border: '1px solid black', backgroundColor: '#00274c'}}>
        {/* One vertical line and one horizontal line */}
        <div style={{position: 'absolute', top: '50%', left: '0', width: '100%', height: '1px', backgroundColor: 'black'}}></div>
        <div style={{position: 'absolute', top: '0', left: '50%', width: '1px', height: '100%', backgroundColor: 'black'}}></div>
        <div style={dotStyle}></div>
      </div>
      <div style={{display: 'flex', gap: '5px'}}>
        <div>
          <p>Beta: </p>
          <input type="range" min="-90" max="90" value={beta} onChange={(e) => setBeta(parseFloat(e.target.value))} style={{background: '#668fac'}} />
        </div>
        <input type="number" min="-90" max="90" value={beta} onChange={(e) => setBeta(parseFloat(e.target.value))} style={{width: '10vw', height: '4vh'}} />
      </div>
      <div style={{display: 'flex', gap: '5px'}}>
        <div>
          <p>Gamma: </p>
          <input type="range" min="-90" max="90" value={gamma} onChange={(e) => setGamma(parseFloat(e.target.value))} style={{background: '#668fac'}} />
        </div>
        <input type="number" min="-90" max="90" value={gamma} onChange={(e) => setGamma(parseFloat(e.target.value))} style={{width: '10vw',height: '4vh'}} />
      </div>
      <div style={{display: 'flex', gap: '5px'}}>
        <div>
          <p>Smoothing Factor: </p>
          <input type="range" min="0" max="1" step="0.01" value={smoothingFactor} onChange={(e) => setSmoothingFactor(parseFloat(e.target.value))} style={{background: '#668fac'}} />
        </div>
        <input type="number" min="0" max="1" step="0.01" value={smoothingFactor} onChange={(e) => setSmoothingFactor(parseFloat(e.target.value))} style={{width: '10vw',height: '4vh'}} />
      </div>
      <button onClick={handleReset} style={{marginTop: '20px'}}>Reset</button>
    </div>
  );
  


  
  }

export default App;