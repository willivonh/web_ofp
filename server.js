const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let userState = {
    user1Clicked: false,
    user2Clicked: false
};

// Serve static files
app.use(express.static('public'));

// Handle WebSocket connections
wss.on('connection', (ws) => {
    // Send the initial state to the newly connected client
    ws.send(JSON.stringify(userState));

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        // Update user state based on which user clicked their button
        if (data.user === 'user1') {
            userState.user1Clicked = data.clicked;
        } else if (data.user === 'user2') {
            userState.user2Clicked = data.clicked;
        }

        // Broadcast the updated state to all connected clients
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(userState));
            }
        });
    });
});

// Start the server
server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});
