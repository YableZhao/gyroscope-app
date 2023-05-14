import React, { Component } from 'react';

window.DeviceMotionEvent.requestPermission()
.then(permissionState => {
  if (permissionState === 'granted') {
    window.addEventListener('devicemotion', this.handleOrientation);
    this.setState({noaccess:false})
  }
})
.catch(console.error);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      alpha: 0,
      beta: 0,
      gamma: 0,
    };
  }

  componentDidMount() {
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', this.handleOrientation);
    } else {
      console.log("Sorry, your browser doesn't support Device Orientation");
    }
  }

  componentWillUnmount() {
    window.removeEventListener('deviceorientation', this.handleOrientation);
  }

  handleOrientation = (event) => {
    this.setState({
      alpha: event.alpha,
      beta: event.beta,
      gamma: event.gamma,
    });
  };

  render() {
    const { alpha, beta, gamma } = this.state;
  
    const dotStyle = {
      position: 'relative',
      top: `${50 + gamma}%`,
      left: `${50 + beta}%`,
      width: '10px',
      height: '10px',
      backgroundColor: 'red',
      borderRadius: '50%',
    };
  
    return (
      <div>
        <h1>Gyroscope Data:</h1>
        <p>Alpha: {alpha}</p>
        <p>Beta: {beta}</p>
        <p>Gamma: {gamma}</p>
        <div style={{position: 'relative', width: '100%', height: '400px', border: '1px solid black'}}>
          <div style={dotStyle}></div>
        </div>
      </div>
    );
  }
  
}

export default App;
