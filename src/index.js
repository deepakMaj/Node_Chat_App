const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const Filter = require("bad-words");
const { generateMessage, generateLocationMessage } = require("./utils/messages");
const { addUser, removeUser, getUser, getUsersInRoom } = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
  socket.on("join", (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });

    if(error) {
      return callback(error);
    }
    
    // Join a user to a room
    socket.join(user.room);

    // Emit the event when a new user joins a room
    socket.emit("message", generateMessage(user.username, `Welcome ${user.username} 😃`));

    // Broadcast event to all users expect the current user in a room
    socket.broadcast.to(user.room).emit("message", generateMessage(user.username, `${user.username} has joined 😃`));

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room)
    });

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const filter = new Filter();

    if(filter.isProfane(message)) {
      return callback("Profanity is not allowed!");
    }

    const user = getUser(socket.id);

    io.to(user.room).emit("message", generateMessage(user.username, message));

    // Send acknowledgement to user
    callback();
  });

  socket.on("sendLocation", (location, callback) => {
    const { latitude, longitude } = location;
    const user = getUser(socket.id);

    io.to(user.room).emit("locationMessage", generateLocationMessage(user.username, `https://google.com/maps?q=${latitude}, ${longitude}`));

    callback("Location shared!");
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if(user) {
      io.to(user.room).emit("message", generateMessage(user.username, `${user.username} has left 🥺`));
      
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Server is up on port ${port}🚀`);
});