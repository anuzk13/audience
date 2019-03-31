import React, { Component } from 'react';
import logo from '../logo.svg';
import Authentication from '../util/Authentication/Authentication'
import './Panel.css';

class Panel extends Component {

  constructor(props){
      super(props)
      this.Authentication = new Authentication()

      //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null. 
      this.twitch = window.Twitch ? window.Twitch.ext : null
      // This binding is necessary to make `this` work in the callback
      this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    this.Authentication.makeCall('https://localhost:8081/color/query').then( a => console.log(a))
  }

  componentDidMount(){
    if(this.twitch){
        this.twitch.onAuthorized((auth)=>{
            console.log(auth)
            this.Authentication.setToken(auth.token, auth.userId)
        })

        this.twitch.listen('broadcast',(target,contentType,body)=>{
            this.twitch.rig.log(`New PubSub message!\n${target}\n${contentType}\n${body}`)
            // now that you've got a listener, do something with the result... 

            // do something...

        })

        this.twitch.onVisibilityChanged((isVisible,_c)=>{
            this.visibilityChanged(isVisible)
        })

        this.twitch.onContext((context,delta)=>{
            console.log(context, delta)
            // this.contextUpdate(context,delta)
        })
    }
  }

  componentWillUnmount(){
    if(this.twitch){
        this.twitch.unlisten('broadcast', ()=>console.log('successfully unlistened'))
    }
  }

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
          <button onClick={this.handleClick}>
            Activate Lasers
          </button>
        </header>
      </div>
    );
  }
}

export default Panel;
