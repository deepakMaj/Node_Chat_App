const socket = io();

// Elements
const $messageForm = document.getElementById("message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.getElementById("send-location");
const $messages = document.getElementById("messages");
const $sidebar = document.getElementById("sidebar");

// Templates
const messageTemplate = document.getElementById("message-template").innerHTML;
const locationMessageTemplate = document.getElementById("location-message-template").innerHTML;
const sidebarTemplate = document.getElementById("sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoScroll = () => {
  const $newMessage = $messages.lastElementChild;
  
  const { marginBottom } = getComputedStyle($newMessage); 
  const newMessageHeight = $newMessage.offsetHeight + parseInt(marginBottom);

  const visibleHeight = $messages.offsetHeight;

  const containerHeight = $messages.scrollHeight;

  const scrollOffset = $messages.scrollTop + visibleHeight;

  if(containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on("message", (message) => {
  const html = Mustache.render(messageTemplate, { 
    message: message.text,
    username: message.username.replace(/(\b[a-z](?!\s))/g, (str) => str.toUpperCase()),
    createdAt: moment(message.createdAt).format('h:mm a')
  });

  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("locationMessage", (message) => {
  const html = Mustache.render(locationMessageTemplate, { 
    url: message.url,
    username: message.username,
    createdAt: moment(message.createdAt).format('h:mm a')
  });

  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("roomData", ({ room, users }) => {
  users.forEach(user => {
    user.username = user.username.replace(/(\b[a-z](?!\s))/g, (str) => str.toUpperCase());
  });
  room = room.replace(/(\b[a-z](?!\s))/g, (str) => str.toUpperCase());
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  });

  $sidebar.insertAdjacentHTML("beforeend", html);
});

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = e.target.elements.message.value;

  // Disable form button
  $messageFormButton.setAttribute("disabled", "disabled");

  socket.emit("sendMessage", message, (error) => {
    // Enable form button
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();

    if(error) {
      return console.log(error);
    }
    
    console.log("Message Delivered!");
  });
});

$sendLocationButton.addEventListener("click", () => {
  if(!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser!");
  }

  // Disable send-location button
  $sendLocationButton.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((position) => {
    const { latitude, longitude } = position.coords;
    socket.emit("sendLocation", { latitude, longitude }, (message) => {
      // Enable send-location button
      $sendLocationButton.removeAttribute("disabled");
      console.log(message);
    });
  });
});

socket.emit("join", { username, room }, (error) => {
  if(error) {
    alert(error);
    location.href = "/";
  }
});