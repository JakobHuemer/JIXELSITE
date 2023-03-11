import './style.scss'

let tempDate = new Date();
let localComments = []

const baseUrl = "http://139.162.157.52:3000"

let comments = [
    {
        author: "JstJxel",
        message: "Willkommen im Steam!",
        timestamp: `${tempDate.getHours()}:${tempDate.getMinutes()}`,
        color: "yellow"
    }
]

window.setInterval(() => {
    loadComments()
}, 1000)

function addComments(localComments) {
    console.log("Adding comments")

    let commentContainer = document.querySelector(".chat")
    localComments.forEach((comment) => {
        let commentElement = document.createElement("div")
        commentElement.classList.add("comment")
        commentElement.classList.add(comment.color)
        commentElement.innerHTML = `<span class="author">${comment.author}</span><span class="message">${comment.message}</span><span class="timestamp">${comment.timestamp}</span>`
        commentContainer.appendChild(commentElement)
    });

}

async function loadComments() {
    console.log("Loading comments")

    const req = await fetch(baseUrl + "/api/comments/0", {
        method: "GET",
    }).then((res) => {
        console.log("COMENTS: ")
        JSON.stringify(res.json())
        console.log(res)
    })

    console.log(req)

    localComments = req

    addComments(localComments)

}