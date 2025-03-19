const socket = new WebSocket("wss://brocode-test.onrender.com/"); // ✅ Updated WebSocket URL

const startChatButton = document.getElementById("start-chat");
const usernameInput = document.getElementById("username");
const chatBox = document.getElementById("chat-box");
const chatArea = document.getElementById("chat-area");
const chatInput = document.getElementById("chat-input");
const sendMessageButton = document.getElementById("send-message");
const logoutButton = document.getElementById("logout");
const loginContainer = document.getElementById("login-container");
const fileInput = document.getElementById("file-input");
const galleryIcon = document.getElementById("gallery-icon");
const clearAllChatButton = document.getElementById("clear-all-chat");

const creatorUsername = "admin"; // Define the creator username
let username = "";

// ✅ Handle WebSocket connection errors and reconnect if needed
socket.onclose = () => {
    console.warn("WebSocket closed. Trying to reconnect...");
    setTimeout(() => {
        location.reload(); // Reload page to reconnect
    }, 3000);
};

// ✅ Start chat
startChatButton.addEventListener("click", () => {
    username = usernameInput.value.trim();
    if (username) {
        loginContainer.style.display = "none";
        chatBox.style.display = "block";
        socket.send(JSON.stringify({ type: "chat", username, message: "has joined the chat!" }));
        checkIfCreator(username);
    } else {
        alert("Please enter a username");
    }
});

// ✅ Send a message
sendMessageButton.addEventListener("click", () => {
    const message = chatInput.value.trim();
    if (message) {
        socket.send(JSON.stringify({ type: "chat", username, message }));
        chatInput.value = ""; // Clear input field
    }
});

// ✅ Log out
logoutButton.addEventListener("click", () => {
    chatBox.style.display = "none";
    loginContainer.style.display = "block";
    socket.send(JSON.stringify({ type: "chat", username, message: "has left the chat." }));
    username = "";
    checkIfCreator(""); // Reset UI
});

// ✅ Open file input when gallery icon is clicked
galleryIcon.addEventListener("click", () => {
    fileInput.click();
});

// ✅ Handle file selection and sending
fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const fileData = {
                username,
                file: {
                    name: file.name,
                    type: file.type,
                    content: event.target.result // Base64 file content
                }
            };
            socket.send(JSON.stringify({ type: "file", data: fileData }));
        };
        reader.readAsDataURL(file); // Convert to Base64 before sending
    }
});

// ✅ Handle incoming WebSocket messages
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "messages") {
        data.data.forEach(msg => displayMessage(msg.username, msg.message, msg.file));
    } else if (data.type === "chat") {
        displayMessage(data.data.username, data.data.message, null);
    } else if (data.type === "file") {
        displayMessage(data.data.username, data.data.message, data.data.file);
    }
};

// ✅ Display messages in chat
function displayMessage(username, message, file) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message");

    let messageContent = `<strong>${username}</strong>: ${message}`;

    // ✅ Display file (image or link)
    if (file) {
        if (file.type.startsWith("image")) {
            messageContent += `<br><img src="${file.content}" alt="${file.name}" style="max-width: 200px;">`;
        } else {
            messageContent += `<br><a href="${file.content}" target="_blank">${file.name}</a>`;
        }
    }

    msgDiv.innerHTML = messageContent;
    chatArea.appendChild(msgDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
}

// ✅ Check if current user is the creator (admin)
function checkIfCreator(username) {
    if (username === creatorUsername) {
        clearAllChatButton.style.display = "inline-block";
        clearAllChatButton.onclick = () => clearAllChats();
    } else {
        clearAllChatButton.style.display = "none";
    }
}

// ✅ Clear all chats (Admin only)
function clearAllChats() {
    chatArea.innerHTML = "";
    socket.send(JSON.stringify({ type: "chat", username: "System", message: "The chat history has been cleared by the admin." }));
}
