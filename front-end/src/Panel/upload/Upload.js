import React, { Component } from 'react';
import './Upload.css';
import Buttons from './Buttons';

class Upload extends Component {

  constructor(props){
        super(props)
        // this.Authentication = new Authentication()
        //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null. 
        this.twitch = window.Twitch ? window.Twitch.ext : null
    }


    onChange = e => {
    
        const errs = [] 
        const files = Array.from(e.target.files)
    
        const formData = new FormData()
        const types = ['image/png', 'image/jpeg', 'image/gif']
    
        const file = files[0];
        
        if (types.every(type => file.type !== type)) {
            errs.push(`'${file.type}' is not a supported format`)
        }

        if (file.size > 150000) {
            errs.push(`'${file.name}' is too large, please pick a smaller file`)
        }
    
        formData.append('file', file)

        this.props.auth.makeCall(
            'https://localhost:8081/upload',
            'POST',
            formData,
            'multipart/form-data').then( a => console.log(a))

      }

    render() {
        return (
            <Buttons onChange={this.onChange} />
        )
    }
}

export default Upload;