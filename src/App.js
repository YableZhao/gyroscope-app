import React, { Component } from 'react';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      alpha: 0,
      beta: 0,
      gamma: 0,
      noaccess: true,
    };
  }

  componentDidMount() {
    if (window.DeviceOrientationEvent) {
      this.handlePermission();
    } else {
      console.log("Sorry, your browser doesn't support Device Orientation");
    }
  }

  componentWillUnmount() {
    window.removeEventListener('deviceorientation', this.handleOrientation);
  }

  handlePermission = async () => {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      const permissionState = await DeviceMotionEvent.requestPermission();

      if (permissionState === 'granted') {
        window.addEventListener('deviceorientation', this.handleOrientation);
        this.setState({ noaccess: false });
      }
    } else {
      // for browsers that don't need permission
      window.addEventListener('deviceorientation', this.handleOrientation);
      this.setState({ noaccess: false });
    }
  };

  handleOrientation = (event) => {
    this.setState({
      alpha: event.alpha,
      beta: event.beta,
      gamma: event.gamma,
    });
  };

  render() {
    const { alpha, beta: betaState, gamma: gammaState, noaccess } = this.state;

    let beta = betaState
    let gamma = gammaState
      // Adjust for device orientation
    switch (window.orientation) {
      case 0:
        // Portrait orientation. This is the default. No need to adjust anything.
        break;
      case 90:
        // Landscape orientation, rotated clockwise
        [beta, gamma] = [gamma, -beta];
        break;
      case -90:
        // Landscape orientation, rotated counterclockwise
        [beta, gamma] = [-gamma, beta];
        break;
      case 180:
        // Upside-down portrait orientation
        [beta, gamma] = [-beta, -gamma];
        break;
      default:
        // Unknown orientation. Don't adjust anything.
        break;
    }
  
    const dotStyle = {
      position: 'relative',
      top: `${50 + beta}%`,
      left: `${50 + gamma}%`,
      width: '10px',
      height: '10px',
      backgroundColor: 'red',
      borderRadius: '50%',
    };
  
    if (noaccess) {
      return (
        <button onClick={this.handlePermission}>
          Grant permission to access motion and orientation
        </button>
      );
    } else {
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
  
}

export default App;
