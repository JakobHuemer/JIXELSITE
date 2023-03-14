import './style.scss'
import escapeHtml from 'escape-html'
const BASE_IP = "139.162.157.52"
// const BASE_IP = "localhost"

function setupCommentSection() {
    const commentSection = document.querySelector(".chat")
    let localTempDate = new Date();

    let tempStamp = `${String(localTempDate.getHours()).padStart(2, "0")}:${String(localTempDate.getMinutes()).padStart(2, '0')}`
    commentSection.innerHTML = `<div class="chat-message" data-isbot="false" data-iscommand="false"> <span class="timestamp">${tempStamp}</span> <span class="author" style="color: #FF0000">JstJxel</span> <span class="message">Willkommen im Chat</span></div>`
}

function appendComment(comment) {
    let commentContainer = document.querySelector(".chat")
    let localTime = new Date(comment.timestamp)
    console.log(localTime)
    comment.timestamp = `${String(localTime.getHours()).padStart(2, "0")}:${String(localTime.getMinutes()).padStart(2, '0')}`
    let elem = `<div class="chat-message"> <span class="timestamp">${comment.timestamp}</span> <span class="author" style="color: ${comment.color}">${escapeHtml(comment.author)}</span> <span class="message">${escapeHtml(comment.message)}</span></div>`
    commentContainer.innerHTML += elem
}

setupCommentSection()

let webSocket = new WebSocket("ws:// " + BASE_IP + ":8412")

webSocket.onopen = function (event) {
    console.log("Connected to server")
};

webSocket.onmessage = function (event) {
    console.log(event.data)
    let data = JSON.parse(event.data)

    if (data.type === "twitch") {
        appendComment(data.data)
    }
}

// const baseUrl = "http://" + BASE_IP + ":3000"
// const twitchUrl = "http://" + BASE_IP + ":8411"
