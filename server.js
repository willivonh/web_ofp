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
    user1ClickedTotal: 0,
    user2ClickedTotal: 0,
    round: 0,
    gameEnded: false
};

let deck = []; // Declare deck globally to persist through the game

// Function to create and shuffle a deck of cards
function createShuffledDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    let newDeck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            newDeck.push(`${rank}${suit}`);
        }
    }
    return newDeck.sort(() => Math.random() - 0.5);
}

// Function to deal cards from the existing deck
function dealFirst() {
    if (deck.length === 0) {
        deck = createShuffledDeck(); // Create a new deck if it’s empty
    }

    gameState.user1Cards = deck.splice(0, 5); // Deal 5 cards to user 1
    gameState.user2Cards = deck.splice(0, 5); // Deal 5 cards to user 2
    gameState.user1Clicked = 0;
    gameState.user2Clicked = 0;
    gameState.user1Board = Array(13).fill(null);
    gameState.user2Board = Array(13).fill(null);
    gameState.gameEnded = false;
}

// Function to deal new cards from the remaining deck
function dealCards() {
    if (deck.length === 0) {
        deck = createShuffledDeck(); // Create a new deck if it’s empty
    }

    gameState.user1Cards = deck.splice(0, 3); // Deal 5 cards to user 1
    gameState.user2Cards = deck.splice(0, 3); // Deal 5 cards to user 2
    gameState.user1Clicked = 0;
    gameState.user2Clicked = 0;
    gameState.round += 1;
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
        } else if (data.action === 'reset') {
            dealFirst();
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
                gameState[`${user}ClickedTotal`] += 1;
            }

            if(gameState.round == 0) {
                // Check if all cards have been placed
                if (gameState.user1Clicked === 5 && gameState.user2Clicked === 5) {
                    dealCards();
                }
            } else if (gameState.user1Clicked === 2 && gameState.user2Clicked === 2) {
                if (gameState.user1ClickedTotal === 13 && gameState.user2ClickedTotal === 13) {
                    gameState.gameEnded = true;
                }
                else {
                    dealCards();
                }
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
