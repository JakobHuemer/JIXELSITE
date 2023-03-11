import './style.scss'

let tempDate = new Date();
let localComments = []

const baseUrl = "http://139.162.157.52:3000"
let lastLocalIndex = 0

let comments = [
    {
        author: "JstJxel",
        message: "Willkommen im Steam!",
        timestamp: `${tempDate.getHours()}:${tempDate.getMinutes()}`,
        color: "yellow"
    }
]

window.setInterval(async () => {
    await loadComments()
}, 1000)

function addComments(comments) {
    console.log("Adding comments")

    let commentContainer = document.querySelector(".chat")
    localComments.forEach((comment) => {
        let elem = `<div class="chat-message"><span class="timestamp">${comment.timestamp}</span><span class="author">${comment.author}</span><span class="message">${comment.message}</span></div>`
        commentContainer.innerHTML += elem
        console.log(elem)
    });

}

async function loadComments() {
    console.log("Loading comments")
    let lreq;

    let req = await fetch(baseUrl + "/api/comments/" + lastRemoteIndex, {
        method: "GET",
    }).then((res) => {
        console.log("COMENTS: ")
        JSON.stringify(res.json())
        console.log(res)
        lreq = req.json()

    }).catch((err) => {
        lreq =
            [
                {
                    "message": "hallo",
                    "timestamp": "12:54",
                    "color": "#FF0000",
                    "bot": false,
                    "command": false,
                    "index": 0
                },
                {
                    "message": "ha",
                    "timestamp": "12:54",
                    "color": "#FF0000",
                    "bot": false,
                    "command": false,
                    "index": 1
                },
                {
                    "message": "htm",
                    "timestamp": "12:55",
                    "color": "#FF0000",
                    "bot": false,
                    "command": false,
                    "index": 2
                },
                {
                    "message": "komisch",
                    "timestamp": "12:55",
                    "color": "#FF0000",
                    "bot": false,
                    "command": false,
                    "index": 3
                }
            ];

    });
//     Handling lreq

    lastLocalIndex = localComments[localComments.length - 1].index || 0

    addComments(lreq)
}