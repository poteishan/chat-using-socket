const socket = io("https://rechat-cnh0.onrender.com")
const form = document.getElementById('send-container')
const msgInp = document.getElementById('messageInp')
const msgCont = document.querySelector('.container')
const btn = document.querySelector("button")
const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
});
let inputImg = document.getElementById("input-img")
let mainImg = document.getElementById("main-img")
let name;
var audio = new Audio('reply.mp3')

function appendImg(img, name, color, position) {

    const wrapper = document.createElement("div");
    wrapper.classList.add("image-message");
    wrapper.classList.add("message");
    wrapper.classList.add(position);

    // Username
    const nameElement = document.createElement("div");
    nameElement.innerText = name;
    nameElement.classList.add("image-sender");

    // Image
    const imgElement = document.createElement("img");
    imgElement.src = img;
    imgElement.classList.add("chat-image");

    // Time
    const timeElement = document.createElement("span");

    timeElement.innerText = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

    timeElement.classList.add("message-time");

    // User color
    if (color) {
        wrapper.style.borderLeft = `4px solid ${color}`;
    }
    
    if (position === 'left') {
        audio.play();
    }

    wrapper.appendChild(nameElement);
    wrapper.appendChild(imgElement);
    wrapper.appendChild(timeElement);
    msgCont.appendChild(wrapper);
}

inputImg.onchange = (name, position) => {
    const file = inputImg.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        // Show image locally
        mainImg.src = reader.result;
        // Send image to server
        socket.emit("send-img", reader.result);
        appendImg(reader.result, "You", null, "right");
    };
    reader.readAsDataURL(file);
};

const appendMsg = (message, position, color = null) => {
    const msgElement = document.createElement("div");
    const textElement = document.createElement("span");
    const timeElement = document.createElement("span");

    textElement.innerText = message;
    timeElement.innerText = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
    timeElement.classList.add("message-time");

    msgElement.classList.add("message", position);
    msgElement.appendChild(textElement);
    msgElement.appendChild(timeElement);
    if (color) {
        msgElement.style.borderLeft = `4px solid ${color}`;
    }
    msgCont.appendChild(msgElement);
    if (position === "left") {
        audio.play();
    }
};

// To prevent reload of form
form.addEventListener("submit", (e) => {
    e.preventDefault()
    const message = msgInp.value
    appendMsg(`You: ${message}`, 'right')
    socket.emit('send', message)
    msgInp.value = ""
})

while (!name || name === null) {
    name = prompt("Enter your name to join")
    if (name === null) {
        alert("No name added, add your name to join")
    }
}

// taking name from server
socket.emit('new-user-joined', name);
socket.on('user-joined', data => {
    appendMsg(`${data.name} joined the chat`, 'center')
});

socket.on('receive', data => {
    appendMsg(`${data.name} ${time}: ${data.message}`, 'left', data.color)
});

socket.on("img", data => {
    appendImg(data.img, data.name, data.color);
});

socket.on('left', data => {
    appendMsg(`${data.name} left the chat`, 'center')
})