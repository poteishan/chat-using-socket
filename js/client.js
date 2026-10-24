
const socket = io("https://rechat-cnh0.onrender.com");

const form = document.getElementById("send-container");
const msgInp = document.getElementById("messageInp");
const msgCont = document.querySelector(".container");
const inputImg = document.getElementById("input-img");

const audio = new Audio("./reply.mp3");

let name = "";

while (!name.trim()) {
    const enteredName = prompt("Enter your name to join");

    if (enteredName === null) {
        alert("Please enter a name to join the chat.");
        continue;
    }

    name = enteredName.trim();
}

function formatTime() {
    return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function playNotification() {
    audio.currentTime = 0;
    audio.play().catch(() => {});
}

function appendMsg(message, position, color = null) {
    const msgElement = document.createElement("div");
    const textElement = document.createElement("span");
    const timeElement = document.createElement("span");

    textElement.textContent = message;
    timeElement.textContent = formatTime();
    timeElement.classList.add("message-time");

    msgElement.classList.add("message", position);

    if (color) {
        msgElement.style.borderLeft = `4px solid ${color}`;
    }

    msgElement.appendChild(textElement);
    msgElement.appendChild(timeElement);
    msgCont.appendChild(msgElement);

    msgCont.scrollTop = msgCont.scrollHeight;

    if (position === "left") {
        playNotification();
    }
}

function appendImg(img, sender, color, position) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("image-message", "message", position);

    const nameElement = document.createElement("div");
    nameElement.textContent = sender;
    nameElement.classList.add("image-sender");

    const imgElement = document.createElement("img");
    imgElement.src = img;
    imgElement.alt = "Shared image";
    imgElement.classList.add("chat-image");

    const timeElement = document.createElement("span");
    timeElement.textContent = formatTime();
    timeElement.classList.add("message-time");

    if (color) {
        wrapper.style.borderLeft = `4px solid ${color}`;
    }

    wrapper.append(nameElement, imgElement, timeElement);
    msgCont.appendChild(wrapper);

    msgCont.scrollTop = msgCont.scrollHeight;

    if (position === "left") {
        playNotification();
    }
}

// Connection diagnostics
socket.on("connect", () => {
    console.log("Connected to ReChat server:", socket.id);
    appendMsg("Connected to chat", "center");
    socket.emit("new-user-joined", name);
});

socket.on("connect_error", (error) => {
    console.error("Socket connection failed:", error.message);
});

socket.on("disconnect", (reason) => {
    console.warn("Socket disconnected:", reason);
});

socket.on("user-joined", (data) => {
    appendMsg(`${data.name} joined the chat`, "center");
});

// Send text messages
form.addEventListener("submit", (event) => {
    event.preventDefault();

    const message = msgInp.value.trim();

    if (!message) return;

    if (!socket.connected) {
        appendMsg("Not connected. Please wait and try again.", "center");
        return;
    }

    socket.emit("send", message);
    appendMsg(`You: ${message}`, "right");

    msgInp.value = "";
});

// Receive text messages
socket.on("receive", (data) => {
    console.log("Received message:", data);

    appendMsg(
        `${data.name}: ${data.message}`,
        "left",
        data.color
    );
});

// Send images
inputImg.addEventListener("change", () => {
    const file = inputImg.files[0];

    if (!file) return;

    if (!socket.connected) {
        appendMsg("Not connected. Cannot send image.", "center");
        inputImg.value = "";
        return;
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
        appendMsg("Please select a JPG or PNG image.", "center");
        inputImg.value = "";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        appendMsg("Please select an image smaller than 5 MB.", "center");
        inputImg.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        const imageData = reader.result;

        socket.emit("send-img", imageData);

        appendImg(imageData, "You", null, "right");
        inputImg.value = "";
    };

    reader.onerror = () => {
        appendMsg("Unable to read the selected image.", "center");
        inputImg.value = "";
    };

    reader.readAsDataURL(file);
});

// Receive images
socket.on("img", (data) => {
    console.log("Received image from:", data.name);

    appendImg(data.img, data.name, data.color, "left");
});

// User leaves
socket.on("left", (data) => {
    appendMsg(`${data.name} left the chat`, "center");
});
