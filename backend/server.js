const express = require('express');
const webApp = express();
const webPort = 80;

function pLog(msg, protocol) {
    let date = new Date().toISOString();
    console.log(`[${date}] ${protocol}: ${msg}`);
}

module.exports = { pLog }

const {twitchbot} = require('./twitchbot/twitchbot');
const {listen} = require("express/lib/application");
twitchbot()


webApp.use(express.static('./frontend/dist'));
webApp.listen(webPort, () => {
    pLog(`Webserver listening on port ${webPort}`, 'HTTP');
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
    pLog(`API-Server listening on port ${port}`, 'API');
});
