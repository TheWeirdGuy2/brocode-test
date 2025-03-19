const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let messages = [];
let users = [];

function broadcastMessage(type, message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type, data: message }));
        }
    });
}

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.send(JSON.stringify({ type: 'messages', data: messages })); // Send chat history

    let username = '';

    ws.on('message', (message) => {
        try {
            const msg = JSON.parse(message);

            if (msg.type === 'chat') {
                username = msg.username || username;
                const newMessage = { username, message: msg.message };
                messages.push(newMessage);
                broadcastMessage('chat', newMessage);
            }

            if (msg.type === 'file') {
                const { username, file } = msg.data;
                if (!file || !file.content || !file.name || !file.type) {
                    console.error('Invalid file data received');
                    return;
                }

                const fileMessage = {
                    username,
                    message: `Sent a file: ${file.name}`,
                    file
                };

                messages.push(fileMessage);
                broadcastMessage('file', fileMessage);
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        users = users.filter(user => user.connection !== ws);
        console.log('Client disconnected');
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
    });
});

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
