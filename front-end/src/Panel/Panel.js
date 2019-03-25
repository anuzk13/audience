import React, { Component } from 'react';
import logo from '../logo.svg';
import './Panel.css';

class Panel extends Component {
  render() {
    return (
      <div className="Panel">
        <header className="Panel-header">
          <img src={logo} className="Panel-logo" alt="logo" />
          <p>
            Edit <code>src/Panel.js</code> and save to reload.
          </p>
          <a
            className="Panel-link"
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

export default Panel;
