import './style.scss'

let tempDate = new Date();
let localComments = []

const baseUrl = "http://localhost:3000"

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

function loadComments() {
    let commentContainer = document.querySelector(".chat")

    const req = fetch(baseUrl + "/api/comments/0", {
        method: "GET"
    })

    console.log(req)

}