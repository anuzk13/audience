import React, { Component } from 'react';
import './Dashboard.css';
import Authentication from '../util/Authentication/Authentication'
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

class Dashboard extends Component {
  state = {
    submissions: null,
  };

  constructor(props){
      super(props)
      this.Authentication = new Authentication()

      //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null. 
      this.twitch = window.Twitch ? window.Twitch.ext : null
  }

  componentDidMount(){
    if(this.twitch){
        this.twitch.onAuthorized((auth)=>{
            this.Authentication.setToken(auth.token, auth.userId)
            this.Authentication.makeCall('submissions_sorted')
            .then( response =>  response.json())
            .then( submissions => this.setState({submissions}))
        })

        this.twitch.listen('broadcast',(target,contentType,body)=>{
            this.twitch.rig.log(`New PubSub message!\n${target}\n${contentType}\n${body}`)
            if (body === 'NEW_UPLOAD' || body === 'NEW_VOTE' ) {
              this.Authentication.makeCall('submissions')
              .then( response =>  response.json())
              .then( submissions =>this.setState({submissions}))
            }
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
    if (this.state.submissions === null) {
      return (
        <div className="Panel">
          <header className="Panel-header">
            LOADING ...
            {/* <Upload auth={this.Authentication} /> */}
          </header>
        </div>
      );
    } else {
      let submissions = this.state.submissions.map( s => 
        <Col xs={6} className="submission" key={s.submission_id}>
          <img src={`${process.env.REACT_APP_API_URL}upload/${s.url}`}></img>
          <p> Votes: {s.votes}</p>
        </Col>)
      // let submissions = 'lol'
      return (
        <div className="Panel">
          <header className="Panel-header">
          <Container>
            <Row>
              {submissions}
            </Row>
          </Container>
          </header>
        </div>
      );
    }
    
  }
}

export default Dashboard;
