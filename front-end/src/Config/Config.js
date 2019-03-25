import React, { Component } from 'react';
import logo from '../logo.svg';
import './Config.css';

class Config extends Component {
  render() {
    return (
      <div className="Config">
        <header className="Config-header">
          <img src={logo} className="Config-logo" alt="logo" />
          <p>
            Edit <code>src/Config.js</code> and save to reload.
          </p>
          <a
            className="Config-link"
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

export default Config;
