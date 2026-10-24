const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer();
const io = new Server(server, {
    cors: {
        origin: "*"
    },
    maxHttpBufferSize: 10 * 1024 * 1024
});
const users = {};
const userColors = {};

function getRandomColor() {
    return "#" + Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0");
}

io.on('connection', socket => {
    // Letting everyone know the new user joined
    socket.on('new-user-joined', name => {
        if (!userColors[name]) {
            userColors[name] = getRandomColor();
        }
        users[socket.id] = {
            name: name,
            color: userColors[name],
        };
        socket.broadcast.emit("user-joined", { name: name, color: userColors[name] })
    });

    // Letting everyone know the message broadcasted into the main website
    socket.on('send', message => {
        const user = users[socket.id];
        if (!user) return;
        socket.broadcast.emit('receive', { message: message, name: user.name, color: user.color })

    });

    socket.on("send-img", img => {
        const user = users[socket.id];
        if (!user) return;
        socket.broadcast.emit("img", { img: img, name: user.name, color: user.color }, "left");
    });

    // Letting everyone know the user left the chat
    socket.on('disconnect', name => {
        const user = users[socket.id];
        if (!user) return;
        socket.broadcast.emit("left", { name: user.name });
        delete users[socket.id];
    });
})

const PORT = process.env.PORT || 8000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
