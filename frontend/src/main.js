import './style.scss'

let tempDate = new Date();
let localComments = []
import escapeHtml from 'escape-html'

// const baseUrl = "http://139.162.157.52:3000"
// const twitchUrl = "http://139.162.157.52:8411"
const baseUrl = "http://localhost:3000"
const twitchUrl = "http://localhost:8411"
let lastLocalIndex = -1

// syncing

function setupCommentSection() {
    const commentSection = document.querySelector(".chat")
    let localTempDate = new Date();

    let tempStamp = `${localTempDate.getHours()}:${localTempDate.getMinutes()}`
    let elem = `<div class="chat-message" data-isbot="false" data-iscommand="false"> <span class="timestamp">${tempStamp}</span> <span class="author" style="color: #FF0000">JstJxel</span> <span class="message">Willkommen im Chat</span></div>`
    commentSection.innerHTML = elem
}

setupCommentSection()

//SSE

const eventSource = new EventSource(twitchUrl + "/comment-sync");

function appendComment(comment) {
    let commentContainer = document.querySelector(".chat")
    let localTime = new Date(comment.timestamp)
    console.log(localTime)
    comment.timestamp = `${localTime.getHours()}:${localTime.getMinutes()}`
    let elem = `<div class="chat-message"> <span class="timestamp">${comment.timestamp}</span> <span class="author" style="color: ${comment.color}">${escapeHtml(comment.author)}</span> <span class="message">${escapeHtml(comment.message)}</span></div>`
    commentContainer.innerHTML += elem
}

eventSource.onmessage = (event) => {
    let data = JSON.parse(event.data)
    appendComment(data)
}

eventSource.onerror = (event) => {
console.log("Error")
    eventSource.close()
};