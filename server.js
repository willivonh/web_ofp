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
    user1Clicked: 0,
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
function dealFirst() {
    const deck = createShuffledDeck();
    gameState.user1Cards = deck.slice(0, 5);
    gameState.user2Cards = deck.slice(5, 10);
    gameState.user1Clicked = 0;
    gameState.user2Clicked = 0;
    gameState.user1Board = Array(13).fill(null);
    gameState.user2Board = Array(13).fill(null);
    gameState.gameEnded = false;
}

// Function to deal 5 cards to each user
function dealCards() {
    const deck = createShuffledDeck();
    gameState.user1Cards = deck.slice(0, 5);
    gameState.user2Cards = deck.slice(5, 10);
    gameState.user1Clicked = 0;
    gameState.user2Clicked = 0;
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
            dealFirst();
        } else if (data.action === 'dealAgain') {
            dealCards();
        } else if(data.action === 'cardClick') {
            const { user, card, row } = data;

            // Get the appropriate board and the user's clicked count
            const board = gameState[`${user}Board`];
            const clickedCount = gameState[`${user}Clicked`];

            // Determine which row to place the card based on the button state
            let rowIndex;
            if (row === 1) {
                rowIndex = 0;
            } else if (row === 2) {
                rowIndex = 3;
            } else if (row === 3) {
                rowIndex = 8;
            }

            // Find the first empty slot in the chosen row
            let placed = false;
            const maxIndex = row === 1 ? 2 : row === 2 ? 7 : 12;
            for (let i = rowIndex; i <= maxIndex; i++) {
                if (!board[i]) {
                    board[i] = card;
                    placed = true;
                    break;
                }
            }

            if (placed) {
                gameState[`${user}Clicked`] += 1;
            }

            // Check if all cards have been placed
            if (gameState.user1Clicked === 5 && gameState.user2Clicked === 5) {
                dealCards();
            }
        }

        // Broadcast the updated game state to all connected clients
        wss.clients.forEach((client) => {
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
