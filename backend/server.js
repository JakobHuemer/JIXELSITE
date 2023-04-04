const express = require('express');
require('dotenv').config();
const webApp = express();
const webPort = 80;

const formatDate = (date) => `${ date.getFullYear() }-${ (date.getMonth() + 1).toString().padStart(2, '0') }-${ date.getDate().toString().padStart(2, '0') } ${ date.getHours().toString().padStart(2, '0') }:${ date.getMinutes().toString().padStart(2, '0') }:${ date.getSeconds().toString().padStart(2, '0') }.${ date.getMilliseconds().toString().padStart(3, '0') }`;
module.exports = { formatDate };

function pLog(msg, protocol) {
    let date = new Date();
    console.log(`[${ formatDate(date) }] ${ protocol }: ${ msg }`);
}

// module.exports = { pLog };

// const {twitchbot} = require('./twitchbot/src/twitchbot');
const { listen } = require('express/lib/application');

// DISCORD BOT  -------------------------------------------------------------------------

const { DiscordBot } = require('./discordbot/src/index');
const TOKEN = process.env.DISCORDJS_TOKEN;
const APP_ID = process.env.DISCORDJS_APPLICATION_ID;
const GUILD_ID = process.env.DISCORDJS_GUILD_ID;

const discordBot = new DiscordBot(TOKEN, APP_ID, GUILD_ID);
discordBot.start();

// TWITCH BOT  -------------------------------------------------------------------------

const { TwitchBot } = require('./twitchbot/src/index');
const CHANNELS = [
    'jstjxel'
];
const USERNAME = process.env.TWITCH_CLIENT_USERNAME;
const OAUTH_TOKEN = process.env.TWITCH_CLIENT_OAUTH_TOKEN;
const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const twitchBot = new TwitchBot(CHANNELS, USERNAME, CLIENT_ID, CLIENT_SECRET, 8412);
// module.exports = { twitchBot };
twitchBot.start();

// TWITCH EVENTSUB  -------------------------------------------------------------------------

const { TwitchEventSub } = require('./twitchbot/src/eventsub');

USER_ACCESS_TOKEN = process.env.TWITCH_USER_ACCESS_TOKEN_JIXEL;

const twitchEventSub = new TwitchEventSub(CLIENT_ID, CLIENT_SECRET, 'jstjxel', USER_ACCESS_TOKEN);
twitchEventSub.start();


webApp.use(express.static('./frontend/dist'));
webApp.listen(webPort, () => {
    pLog(`Webserver listening on port ${ webPort }`, 'HTTP');
});


// BACKEND API -------------------------------------------------------------------------

const app = express();
const port = 3000;

app.use(express.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});


app.listen(port, () => {
    pLog(`API-Server listening on port ${ port }`, 'API');
});
