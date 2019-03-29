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

To run the frontend, `cd front-end` run `HTTPS=true yarn start`

### To run the backend

To run the EBS, `cd back-end`  run `node backend`, with the following command line arguments: `-c <client id>`, `-s <secret>`, `-o <owner id>`.

#### On MacOS
`cd back-end` run `npm install` and then `npm run cert`

#### On Windows
Run the following commands to generate the necessary certificates for your Hello World backend
1. `node scripts/ssl.js`
2. `mkdir ../my-extension/conf`
3. `mv ssl/selfsigned.crt ../my-extension/conf/server.crt`
4. `mv ssl/selfsigned.key ../my-extension/conf/server.key`


To get the owner ID, you will need to execute a simple CURL command against the Twitch `/users` endpoint. You'll need your extension client ID as part of the query (this will be made consistent with the Developer Rig shortly, by using _owner name_).

```bash
curl -H "Client-ID: <client id>" -X GET "https://api.twitch.tv/helix/users?login=<owner name>"
```