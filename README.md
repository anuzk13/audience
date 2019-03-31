Base Folder for the Audience extensions

### Proposed folder structure 

Audience
├── back-end
├── front-end
    ├──src
        ├──Panel
        ├──Overlay
        ├──Config
        ├──Dashboard


### To run the frontend

#### Install dependencies
`cd front-end` run `yarn install` 

#### Run
To run the frontend, `cd front-end` run `HTTPS=true yarn start`

### To run the backend

#### Install dependencies
#### On MacOS
run `bash bin/generate_cert.sh server` 
`cd back-end` run `npm install` 

#### On Windows
run `bin/generate_cert.cmd server` 
`cd back-end` run `npm install`

#### Run
To run the EBS, `cd back-end`  run `node src/backend`, with the following command line arguments: `-c <client id>`, `-s <secret>`, `-o <owner id>`.

To get the owner ID, you will need to execute a simple CURL command against the Twitch `/users` endpoint. You'll need your extension client ID as part of the query (this will be made consistent with the Developer Rig shortly, by using _owner name_).

```bash
curl -H "Client-ID: <client id>" -X GET "https://api.twitch.tv/helix/users?login=<owner name>"
```