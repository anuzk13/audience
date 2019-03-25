import React, { Component } from 'react';
import logo from '../logo.svg';
import './Overlay.css';

class Overlay extends Component {
  render() {
    return (
      <div className="Overlay">
        <header className="Overlay-header">
          <img src={logo} className="Overlay-logo" alt="logo" />
          <p>
            Edit <code>src/Overlay.js</code> and save to reload.
          </p>
          <a
            className="Overlay-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }
}

export default Overlay;
