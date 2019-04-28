import React, { Component } from 'react';
import './Upload.css';

class Upload extends Component {

  constructor(props){
        super(props)
        // this.Authentication = new Authentication()
        //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null. 
        this.twitch = window.Twitch ? window.Twitch.ext : null
        this.state = {message:'Select a File'};
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
            'upload',
            'POST',
            formData,
            'multipart/form-data').then( a => console.log(a))

      }
      getUploadedFileName = (e) => {
        const errs = [] 
        const files = Array.from(e.target.files)
    
        const formData = new FormData()
        const types = ['image/png', 'image/jpeg', 'image/gif']
    
        const file = files[0];
        
        if (types.every(type => file.type !== type)) {
            const message = `'${file.type}' is not a supported format`
            this.setState({...this.state,message});
        }

        if (file.size > 400000) {
            const message = `'${file.name}' is too large, please pick a smaller file`
            this.setState({...this.state,message});
        } else {
            const message = `Uploading${file.name}`
            formData.append('file', file)
            this.setState({...this.state,message});
            this.props.auth.makeCall(
                'upload',
                'POST',
                formData,
                'multipart/form-data').then( a => {
                    const message = 'Select a File'
                    formData.append('file', file)
                    this.setState({...this.state,message});
                })
        }
        
     }

    render() {
        const id = 'form-input'
        const multiple = false
        return (
            <div className="file-upload">
            <input id={id} type="file" className="km-btn-file"
                multiple={multiple} 
                onChange={this.getUploadedFileName}>
            </input>
            <label htmlFor={id} className="km-button km-button--primary km-btn-file-label">
                <span>{this.state.message}</span>
            </label>
            </div>
        )
    }
}

export default Upload;