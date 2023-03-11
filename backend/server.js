const express = require('express');
const app = express();
const port = 3000;

const { twitchbot } = require('./twitchbot/twitchbot');
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

app.use(express.json());
app.use("site", express.static('./frontend/dist'));

function getLastComments(boundStart, boundEnd, comments) {
    let viewComments = []
    for (let i = boundEnd; i > boundStart; i--) {
        viewComments.push(comments.filter(comment => comment.index === i)[0])
    }
    return viewComments
}

app.get("/api/comments/:index", (req, res) => {
    const { index: siteIndex } = req.params;

    let lastIndex = comments[comments.length - 1]?.index || 0;

    let returnComments = getLastComments(siteIndex, lastIndex, comments);

    res.status(200).json(returnComments);
});

app.listen(port, () => {
    pLog(`Server listening on port ${port}`, 'HTTP');
});
