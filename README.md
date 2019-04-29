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
        
├── bin

├── conf

### Generate certificates
To run a secure server with node and webpack you must use this commands to create certificates under /conf

#### On Windows
run `bin/generate_cert.cmd server` 

#### On MacOS
run `bash bin/generate_cert.sh server` 

### To run the frontend

#### Install dependencies
`cd front-end` run `yarn install` 

#### Run
To run the frontend, `cd front-end` run `HTTPS=true yarn start`

### To run the backend

#### Install dependencies

`cd back-end` run `npm install` 

#### Run
To run the EBS, `cd back-end`  run `node src/backend`, with the following command line arguments: `-c <client id>`, `-s <secret>`, `-o <owner id>`.

To get the owner ID, you will need to execute a simple CURL command against the Twitch `/users` endpoint. You'll need your extension client ID as part of the query (this will be made consistent with the Developer Rig shortly, by using _owner name_).

```bash
curl -H "Client-ID: <client id>" -X GET "https://api.twitch.tv/helix/users?login=<owner name>"
```

#### Endpoints:

- /submissions @GET
    - input : 
        - token for user_id, channel_id
    - output:
        - [
                {
                        'type' : '',
                        'src' : 'url',
                        'author': id,
                        'votes': '',
                        'id': ''
                }
        ]

- /vote @POST
    - input :
        - token for user_id, channel_id
        - body : ```{
                vote_submission_id: int // submission id that the user is voting for
        }```
    - output:
        - null
