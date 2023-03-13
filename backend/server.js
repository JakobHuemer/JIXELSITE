const express = require('express');
const app = express();
const port = 3000;
const webApp = express();
const webPort = 80;


const {twitchbot} = require('./twitchbot/twitchbot');
const {listen} = require("express/lib/application");
twitchbot()

function loadComments() {
    try {
        const fs = require('fs');
        const data = fs.readFileSync('./backend/twitchbot/data/comments.json', 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(err)
    }
}

let comments = loadComments()

function pLog(msg, protocol) {
    let date = new Date().toISOString();
    console.log(`[${date}] ${protocol}: ${msg}`);
}

module.exports = { pLog }

webApp.use(express.static('./frontend/dist'));

webApp.listen(webPort, () => {
    pLog(`Webserver listening on port ${webPort}`, 'HTTP');
});

app.use(express.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});


function getLastComments(boundStart, boundEnd, comments) {
    pLog(`Getting comments from ${boundStart} to ${boundEnd}\n--------------------\n`, 'getComments');
    let viewComments = []
    for (let i = boundEnd; i > boundStart; i--) {
        viewComments.push(comments.filter(comment => comment.index === i)[0])
    }
    return viewComments
}


app.get("/api/comments/:index", (req, res) => {
    pLog(`GET /api/comments/${req.params.index}`, 'HTTP')
    const {index: siteIndex} = req.params;

    let comments = loadComments()
    let lastIndex = comments[comments.length - 1]?.index || 0;
    console.log(lastIndex);

    if (!siteIndex) {
        return res.status(400).send({status: "Bad request"})
    }
    if (siteIndex == -1) {
        console.log("RETURNING")
        return res.status(200).json({index: lastIndex});
    }

    if (siteIndex < lastIndex) {


        let returnComments = getLastComments(siteIndex, lastIndex, comments);

        pLog(`Returning ${returnComments.length} comments`, 'HTTP');
        res.status(200).json({comments: returnComments});
    } else {
        pLog(`Returning 0 comments`, 'HTTP');
        res.status(200).json({comments: []});
    }
});


app.listen(port, () => {
    pLog(`API-Server listening on port ${port}`, 'HTTP');
});
