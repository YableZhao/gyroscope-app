import React, { useEffect, useState } from 'react';
import useOrientationPermission from './useOrientationPermission';
import { useFrame, Canvas } from "@react-three/fiber";
import * as THREE from "three";

function Cube({ alpha, beta, gamma }) {
  return (
    <mesh rotation={[beta, gamma, alpha]}>
      <boxGeometry args={[2,4,0.5]} />
      <meshStandardMaterial color={"orange"} />
    </mesh>
  );
}

function App() {
  const { permission, requestPermission } = useOrientationPermission();

  const [alpha, setAlpha] = useState(0);
  const [beta, setBeta] = useState(0);
  const [gamma, setGamma] = useState(0);
  const [sampleSize, setSampleSize] = useState(1); // Add a state for sample size

  const [alphaHist, setAlphaHist] = useState([]);
  const [betaHist, setBetaHist] = useState([]);
  const [gammaHist, setGammaHist] = useState([]);

  const handleReset = () => {
    setAlpha(0);
    setBeta(0);
    setGamma(0);
    setSampleSize(1);
    setAlphaHist([]);
    setBetaHist([]);
    setGammaHist([]);
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

  useEffect(() => {
    setAlphaHist(hist => [alpha, ...hist].slice(0, sampleSize));
    setBetaHist(hist => [beta, ...hist].slice(0, sampleSize));
    setGammaHist(hist => [gamma, ...hist].slice(0, sampleSize));
  }, [alpha, beta, gamma, sampleSize]);

  let alphaAdjusted = alphaHist.reduce((acc, val) => acc + val, 0) / alphaHist.length;
  let betaAdjusted = betaHist.reduce((acc, val) => acc + val, 0) / betaHist.length;
  let gammaAdjusted = gammaHist.reduce((acc, val) => acc + val, 0) / gammaHist.length;

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

  let alphaRadian = alphaAdjusted * Math.PI / 180;
  let betaRadian = betaAdjusted * Math.PI / 180;
  let gammaRadian = gammaAdjusted * Math.PI / 180;

  const dotStyle = {
    position: 'relative',
    top: `${50 + betaAdjusted}%`,
    left: `${50 + gammaAdjusted}%`,
    width: '10px',
    height: '10px',
    backgroundColor: "#ffcb05",
    borderRadius: '50%',
  };

  return (
    <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '2vh'}}>
      <button 
        onClick={requestPermission} 
        style={{backgroundColor: permission === 'granted' ? '#668fac' : '#ffd24d', borderRadius: '12px', padding: '10px', border: 'none', cursor: 'pointer'}}
      >
        {permission === 'granted' ? 'Revoke' : 'Grant'} permission to access motion and orientation
      </button>
      <div style={{position: 'relative', width: '25vh', height: '25vh', border: '1px solid black', backgroundColor: '#00274c'}}>
        {/* One vertical line and one horizontal line */}
        <div style={{position: 'absolute', top: '50%', left: '0', width: '100%', height: '1px', backgroundColor: 'black'}}></div>
        <div style={{position: 'absolute', top: '0', left: '50%', width: '1px', height: '100%', backgroundColor: 'black'}}></div>
        <div style={dotStyle}></div>
      </div>
      {/* 3D plane */}
      <div style={{ width: "25vh", height: "25vh" }}>
        <Canvas>
          <ambientLight />
          <pointLight position={[10, 10, 10]} />
          <Cube alpha={alphaRadian} beta={betaRadian} gamma={gammaRadian} />
        </Canvas>
      </div>
      <div style={{display: 'flex', gap: '2px'}}>
        <div>
          <p>Alpha: </p>
          <input type="range" min="0" max="360" value={alpha} onChange={(e) => setAlpha(parseFloat(e.target.value))} style={{background: '#668fac'}} />
        </div>
        <input type="number" min="0" max="360" value={alpha} onChange={(e) => setAlpha(parseFloat(e.target.value))} style={{width: '10vw', height: '2vh'}} />
        <div>
          <p>Beta: </p>
          <input type="range" min="-180" max="180" value={beta} onChange={(e) => setBeta(parseFloat(e.target.value))} style={{background: '#668fac'}} />
        </div>
        <input type="number" min="-180" max="180" value={beta} onChange={(e) => setBeta(parseFloat(e.target.value))} style={{width: '10vw', height: '2vh'}} />
      </div>
      <div style={{display: 'flex', gap: '2px'}}>
        <div>
          <p>Gamma: </p>
          <input type="range" min="-180" max="180" value={gamma} onChange={(e) => setGamma(parseFloat(e.target.value))} style={{background: '#668fac'}} />
        </div>
        <input type="number" min="-180" max="180" value={gamma} onChange={(e) => setGamma(parseFloat(e.target.value))} style={{width: '10vw',height: '2vh'}} />
        <div>
          <p>Sample Size: </p>
          <input type="range" min="1" max="100" value={sampleSize} onChange={(e) => setSampleSize(parseInt(e.target.value))} style={{background: '#668fac'}} />
        </div>
        <input type="number" min="1" max="100" value={sampleSize} onChange={(e) => setSampleSize(parseInt(e.target.value))} style={{width: '10vw', height: '2vh'}} />
      </div>
      <button onClick={handleReset} style={{marginTop: '1vh' ,marginBottom: '1vh'}}>Reset</button>
    </div>
  );
}

export default App;
