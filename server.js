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
    gameStarted: false,
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
    gameState.gameStarted = true;
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

function evaluateHand(cards) {
    // Function to compute hand rank (this will need to handle multiple poker hands)
    // Here we'll implement a very basic hand evaluator to get you started

    // Helper to get card rank value (Ace is high, can modify for low straight rules)
    const rankOrder = {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
        'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };

    // Extract ranks and suits from the card array
    const ranks = cards.map(card => rankOrder[card.slice(0, -1)]).sort((a, b) => a - b);
    const suits = cards.map(card => card.slice(-1));

    // Count occurrences of each rank
    const rankCounts = {};
    ranks.forEach(rank => rankCounts[rank] = (rankCounts[rank] || 0) + 1);

    // Check for pairs, three-of-a-kinds, four-of-a-kinds, etc.
    const counts = Object.values(rankCounts).sort((a, b) => b - a); // Sort counts from high to low

    // Check for straight (consecutive ranks)
    const isStraight = ranks.every((r, i) => i === 0 || r === ranks[i - 1] + 1);

    // Check for flush (same suit)
    const isFlush = suits.every(suit => suit === suits[0]);

    // Determine hand strength
    if (isStraight && isFlush) return 'Straight Flush';
    if (counts[0] === 4) return 'Four of a Kind';
    if (counts[0] === 3 && counts[1] === 2) return 'Full House';
    if (isFlush) return 'Flush';
    if (isStraight) return 'Straight';
    if (counts[0] === 3) return 'Three of a Kind';
    if (counts[0] === 2 && counts[1] === 2) return 'Two Pair';
    if (counts[0] === 2) return 'Pair';
    return 'High Card';
}

function compareHands(user1Hand, user2Hand) {
    const handRankings = ['High Card', 'Pair', 'Two Pair', 'Three of a Kind', 'Straight', 'Flush', 'Full House', 'Four of a Kind', 'Straight Flush'];
    
    const user1Rank = handRankings.indexOf(evaluateHand(user1Hand));
    const user2Rank = handRankings.indexOf(evaluateHand(user2Hand));

    if (user1Rank > user2Rank) {
        return 'user1';
    } else if (user1Rank < user2Rank) {
        return 'user2';
    } else {
        return 'tie'; // If ranks are the same
    }
}

function computeResults(user1Board, user2Board) {
    // Top Row: First 3 cards
    let topResult = compareHands(user1Board.slice(0, 3), user2Board.slice(0, 3));

    // Middle Row: Next 5 cards
    let middleResult = compareHands(user1Board.slice(3, 8), user2Board.slice(3, 8));

    // Bottom Row: Last 5 cards
    let bottomResult = compareHands(user1Board.slice(8, 13), user2Board.slice(8, 13));

    return {
        topRowWinner: topResult,
        middleRowWinner: middleResult,
        bottomRowWinner: bottomResult
    };
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
                    let results = computeResults(gameState.user1Board, gameState.user2Board);
                    console.log(results);
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
