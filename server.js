const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let gameState = {
    user1Cards: [],
    user2Cards: [],
    user1Board: Array(13).fill(null),
    user2Board: Array(13).fill(null),
    user1Clicked: 0,  // Counts how many cards have been clicked
    user2Clicked: 0,
    gameEnded: false
};

// Function to create a shuffled deck of cards
function createShuffledDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    let deck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            deck.push(`${rank}${suit}`);
        }
    }
    return deck.sort(() => Math.random() - 0.5);
}

// Function to deal 5 cards to each user
function dealCards() {
    const deck = createShuffledDeck();
    gameState.user1Cards = deck.slice(0, 5);
    gameState.user2Cards = deck.slice(5, 10);
    gameState.user1Clicked = 0;
    gameState.user2Clicked = 0;
    gameState.user1Board = Array(13).fill(null);
    gameState.user2Board = Array(13).fill(null);
    gameState.gameEnded = false;
}

// Serve static files
app.use(express.static('public'));

// Handle WebSocket connections
wss.on('connection', (ws) => {
    // Send initial game state to the new client
    ws.send(JSON.stringify(gameState));

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.action === 'deal') {
            dealCards();
        } else if (data.action === 'cardClick') {
            if (data.user === 'user1') {
                // Find the first empty slot in the selected row
                let rowIndex = (data.row - 1) * 5; // Adjust for your board structure
                for (let i = 0; i < 5; i++) {
                    if (!gameState.user1Board[rowIndex + i]) {
                        gameState.user1Board[rowIndex + i] = data.card; // Place the card
                        gameState.user1Clicked++;
                        break; // Exit after placing the card
                    }
                }
            } else if (data.user === 'user2') {
                // Find the first empty slot in the selected row
                let rowIndex = (data.row - 1) * 5; // Adjust for your board structure
                for (let i = 0; i < 5; i++) {
                    if (!gameState.user2Board[rowIndex + i]) {
                        gameState.user2Board[rowIndex + i] = data.card; // Place the card
                        gameState.user2Clicked++;
                        break; // Exit after placing the card
                    }
                }
            }
        } else if (data.action === 'reset') {
            gameState = {
                user1Cards: [],
                user2Cards: [],
                user1Board: Array(13).fill(null),
                user2Board: Array(13).fill(null),
                user1Clicked: 0,
                user2Clicked: 0,
                gameEnded: false
            };
        }

        // Check if both users have placed all 5 cards
        if (gameState.user1Clicked === 5 && gameState.user2Clicked === 5) {
            gameState.gameEnded = true;
        }

        // Broadcast the updated game state to all clients
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(gameState));
            }
        });
    });
});

// Start the server
server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});
