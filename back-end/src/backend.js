/**
 *    Copyright 2018 Amazon.com, Inc. or its affiliates
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

const fs = require('fs');
const Inert = require('inert')
const Hapi = require('hapi');
const path = require('path');
const Boom = require('boom');
const ext = require('commander');
const jsonwebtoken = require('jsonwebtoken');
const request = require('request');
const mysql = require('mysql')
const Q = require('q');

// The developer rig uses self-signed certificates.  Node doesn't accept them
// by default.  Do not use this in production.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Use verbose logging during development.  Set this to false for production.
const verboseLogging = true;
const verboseLog = verboseLogging ? console.log.bind(console) : () => { };

// Service state variables
const serverTokenDurationSec = 30;          // our tokens for pubsub expire after 30 seconds
const userCooldownMs = 1000;                // maximum input rate per user to prevent bot abuse
const userCooldownClearIntervalMs = 60000;  // interval to reset our tracking object
const channelCooldownMs = 1000;             // maximum broadcast rate per channel
const bearerPrefix = 'Bearer ';             // HTTP authorization headers have this prefix
const channelCooldowns = {};                // rate limit compliance
let userCooldowns = {};                     // spam prevention

const STRINGS = {
  secretEnv: usingValue('secret'),
  clientIdEnv: usingValue('client-id'),
  ownerIdEnv: usingValue('owner-id'),
  serverStarted: 'Server running at %s',
  secretMissing: missingValue('secret', 'EXT_SECRET'),
  clientIdMissing: missingValue('client ID', 'EXT_CLIENT_ID'),
  ownerIdMissing: missingValue('owner ID', 'EXT_OWNER_ID'),
  messageSendError: 'Error sending message to channel %s: %s',
  pubsubResponse: 'Message to c:%s returned %s',
  cooldown: 'Please wait before clicking again',
  invalidAuthHeader: 'Invalid authorization header',
  invalidJwt: 'Invalid JWT',
  twitchBroadcast: 'Started Twitch Broadcast'
};

ext.
  version(require('../package.json').version).
  option('-s, --secret <secret>', 'Extension secret').
  option('-c, --client-id <client_id>', 'Extension client ID').
  option('-o, --owner-id <owner_id>', 'Extension owner ID').
  parse(process.argv);

const ownerId = getOption('ownerId', 'EXT_OWNER_ID');
const secret = Buffer.from(getOption('secret', 'EXT_SECRET'), 'base64');
const clientId = getOption('clientId', 'EXT_CLIENT_ID');

const serverOptions = {
  host: 'localhost',
  port: 8081,
  routes: {
    cors: { origin: 'ignore' },
  },
};
const serverPathRoot = path.resolve(__dirname, '../..', 'conf', 'server');
if (fs.existsSync(serverPathRoot + '.crt') && fs.existsSync(serverPathRoot + '.key')) {
  serverOptions.tls = {
    // If you need a certificate, execute "npm run cert".
    cert: fs.readFileSync(serverPathRoot + '.crt'),
    key: fs.readFileSync(serverPathRoot + '.key'),
  };
}
const server = new Hapi.Server(serverOptions);


const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'audience_database'
});

connection.connect();

(async () => {
  await server.register(Inert)
  // get the image file
  server.route({
    method: 'GET',
    path: '/upload/{file*}',
    handler: {
      directory: {
        path: 'upload'
      }
    }
  })

  // upload img files
  server.route({
    path: '/upload',
    method: 'POST',
    handler: fileHandler,
    options: {
      payload: {
        output: 'stream',
      }
    },
  })

  // return the list of current submissions
  server.route({
    path: '/submissions',
    method: 'GET',
    handler: submissionHandler
  })

  // return the list of current submissions
  server.route({
    path: '/submissions_sorted',
    method: 'GET',
    handler: submissionSortedHandler
  })
  
   // return the credentials of the user
   server.route({
    path: '/credentials',
    method: 'GET',
    handler: (req, h) => {
      const { payload } = req
      const h_payload = verifyAndDecode(req.headers.authorization);
      return h_payload;
    }
  })

  // vote for a submission
  server.route({
    path: '/vote',
    method: 'POST',
    handler: voteHandler
  })

  // Start the server.
  await server.start();
  console.log(STRINGS.serverStarted, server.info.uri);

  // Periodically clear cool-down tracking to prevent unbounded growth due to
  // per-session logged-out user tokens.
  setInterval(() => { userCooldowns = {}; }, userCooldownClearIntervalMs);
})();

function usingValue(name) {
  return `Using environment variable for ${name}`;
}

function missingValue(name, variable) {
  const option = name.charAt(0);
  return `Extension ${name} required.\nUse argument "-${option} <${name}>" or environment variable "${variable}".`;
}

// Get options from the command line or the environment.
function getOption(optionName, environmentName) {
  const option = (() => {
    if (ext[optionName]) {
      return ext[optionName];
    } else if (process.env[environmentName]) {
      console.log(STRINGS[optionName + 'Env']);
      return process.env[environmentName];
    }
    console.log(STRINGS[optionName + 'Missing']);
    process.exit(1);
  })();
  console.log(`Using "${option}" for ${optionName}`);
  return option;
}

// Verify the header and the enclosed JWT.
function verifyAndDecode(header) {
  if (header.startsWith(bearerPrefix)) {
    try {
      const token = header.substring(bearerPrefix.length);
      return jsonwebtoken.verify(token, secret, { algorithms: ['HS256'] });
    }
    catch (ex) {
      throw Boom.unauthorized(STRINGS.invalidJwt);
    }
  }
  throw Boom.unauthorized(STRINGS.invalidAuthHeader);
}

async function fileHandler(req) {
  const { payload } = req
  const h_payload = verifyAndDecode(req.headers.authorization);
  const { channel_id: channelId, user_id: userId } = h_payload;
  const response = await handleFileUpload(payload.file).then((pub_message) => {
    return saveSubmission(channelId, userId, pub_message.message)
  });
  attemptTwitchBroadcast(channelId, 'NEW_UPLOAD');
  return response;
}

function handleFileUpload (file) {
  const filename = file.hapi.filename
  const data = file._data
  return new Promise((resolve, reject) => {
    fs.writeFile('./upload/' + filename, data, err => {
      if (err) {
        reject(err)
      }
      resolve({ message: filename })
    })
  })
 }

function saveSubmission(channelId, userId, filename) {
  return Q.Promise(function (resolve, reject) {
    const q_string = `insert INTO submissions (user_id,channel_id,url) VALUES ('${userId}', '${channelId}', '${filename}')`
    const query = connection.query(q_string, (err, result) => {
        if (err) {
            return resolve([channelId, userId, filename, q_string])
        } else {
            return resolve(result);
        }
    });
  })
}

function getAllSubmissions(channelId) {
  return Q.Promise(function (resolve, reject) {
    const query = connection.query('SELECT * FROM submissions WHERE channel_id = "' + channelId + '"', (err, result) => {
        if (err) {
            return reject(err)
        } else {
            return resolve(result);
        }
    });
  })
}


function sortVotes(channelId) {
  return Q.Promise(function (resolve, reject) {
    const query = connection.query('SELECT * FROM audience_database.submissions WHERE channel_id = "' + channelId + '" ORDER BY votes DESC', (err, result) => {
        if (err) {
            return reject(err)
        } else {
            return resolve(result);
        }
    });
  })
}


async function submissionHandler(req, h) {
  const { payload } = req
  const h_payload = verifyAndDecode(req.headers.authorization);
  const { channel_id: channelId, user_id: userId } = h_payload;
  let submissions = await getAllSubmissions(channelId)
  return submissions;
}

async function submissionSortedHandler(req, h) {
  const { payload } = req
  const h_payload = verifyAndDecode(req.headers.authorization);
  const { channel_id: channelId, user_id: userId } = h_payload;
  let submissions = await sortVotes(channelId)
  return submissions;
}

function addVote(submission_id) {
  return Q.Promise(function (resolve, reject) {
    const qry = 'UPDATE submissions SET votes = votes + 1 WHERE submission_id = ' + submission_id
    connection.query(qry, (err, result) => {
        console.log(qry)
        if (err) {
            return resolve('ERROR')
        } else {
            return resolve(result);
        }
    });
  })
}

async function voteHandler(req) {
  const { payload } = req
  const h_payload = verifyAndDecode(req.headers.authorization);
  const { channel_id: channelId, user_id: userId } = h_payload;
  const vote_submission_id = payload.vote_submission_id;
  let res = await addVote(vote_submission_id)
  attemptTwitchBroadcast(channelId, 'NEW_VOTE');
  return res;
}

function attemptTwitchBroadcast(channelId, message) {
  // Check the cool-down to determine if it's okay to send now.
  const now = Date.now();
  const cooldown = channelCooldowns[channelId];
  if (!cooldown || cooldown.time < now) {
    // It is.
    sendTwitchBroadcast(channelId, message);
    channelCooldowns[channelId] = { time: now + channelCooldownMs };
  } else if (!cooldown.trigger) {
    // It isn't; schedule a delayed broadcast if we haven't already done so.
    cooldown.trigger = setTimeout(sendTwitchBroadcast, now - cooldown.time, channelId);
  }
}

function sendTwitchBroadcast(channelId, message) {
  // Set the HTTP headers required by the Twitch API.
  const headers = {
    'Client-ID': clientId,
    'Content-Type': 'application/json',
    'Authorization': bearerPrefix + makeServerToken(channelId),
  };

  // Create the POST body for the Twitch API request.
  const body = JSON.stringify({
    content_type: 'application/json',
    message,
    targets: ['broadcast'],
  });

  // Send the broadcast request to the Twitch API.
  verboseLog(STRINGS.twitchBroadcast, message, channelId);
  request(
    `https://api.twitch.tv/extensions/message/${channelId}`,
    {
      method: 'POST',
      headers,
      body,
    }
    , (err, res) => {
      if (err) {
        console.log(STRINGS.messageSendError, channelId, err);
      } else {
        verboseLog(STRINGS.pubsubResponse, channelId, res.statusCode);
      }
    });
}

// Create and return a JWT for use by this service.
function makeServerToken(channelId) {
  const payload = {
    exp: Math.floor(Date.now() / 1000) + serverTokenDurationSec,
    channel_id: channelId,
    user_id: ownerId, // extension owner ID for the call to Twitch PubSub
    role: 'external',
    pubsub_perms: {
      send: ['*'],
    },
  };
  return jsonwebtoken.sign(payload, secret, { algorithm: 'HS256' });
}

function userIsInCooldown(opaqueUserId) {
  // Check if the user is in cool-down.
  const cooldown = userCooldowns[opaqueUserId];
  const now = Date.now();
  if (cooldown && cooldown > now) {
    return true;
  }

  // Voting extensions must also track per-user votes to prevent skew.
  userCooldowns[opaqueUserId] = now + userCooldownMs;
  return false;
}
