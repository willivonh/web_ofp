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
    user1Finished: false,
    user2Finished: false,
    gameStarted: false,
    user1Score: 0,
    user2Score: 0,
    user1SelectedCard: 0,
    user2SelectedCard: 0,
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
    gameState.user1SelectedCard = 0;
    gameState.user2SelectedCard = 0;
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
    gameState.user1Finished = false;
    gameState.user2Finished = false;
    gameState.gameEnded = false;
}

function evaluateHand(cards) {
    const rankOrder = {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
        'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };

    const ranks = cards.map(card => rankOrder[card.slice(0, -1)]).sort((a, b) => a - b);
    const suits = cards.map(card => card.slice(-1));
    
    const rankCounts = {};
    ranks.forEach(rank => rankCounts[rank] = (rankCounts[rank] || 0) + 1);

    const counts = Object.values(rankCounts).sort((a, b) => b - a);

    const isFlush = suits.every(suit => suit === suits[0]);
    const isStraight = ranks.every((r, i) => i === 0 || r === ranks[i - 1] + 1);

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
        return 'tie';
    }
}

function calculateRoyalties(row, position) {
    let royalties = 0;

    const hand = evaluateHand(row);

    if (position === 'top') {
        // Check for pairs of 6s or better
        if (hand === 'Pair') {
            const rank = row[0].slice(0, -1); // Get the rank of the pair
            const rankOrder = { '6': 1, '7': 2, '8': 3, '9': 4, '10': 5, 'J': 6, 'Q': 7, 'K': 8, 'A': 9 };
            royalties += rankOrder[rank] || 0;
        }
    } else if (position === 'middle') {
        // Straight or better
        if (hand === 'Straight') royalties += 2;
        if (hand === 'Flush') royalties += 4;
        if (hand === 'Full House') royalties += 6;
        if (hand === 'Four of a Kind') royalties += 10;
        if (hand === 'Straight Flush') royalties += 15;
        if (hand === 'Royal Flush') royalties += 50;
    } else if (position === 'bottom') {
        // Full House or better
        if (hand === 'Full House') royalties += 6;
        if (hand === 'Four of a Kind') royalties += 10;
        if (hand === 'Straight Flush') royalties += 15;
        if (hand === 'Royal Flush') royalties += 25;
    }

    return royalties;
}

function computePoints(user1Board, user2Board) {
    let user1Points = 0;
    let user2Points = 0;

    // Compare Top Row
    let topResult = compareHands(user1Board.slice(0, 3), user2Board.slice(0, 3));
    if (topResult === 'user1') user1Points += 1;
    if (topResult === 'user2') user2Points += 1;

    // Compare Middle Row
    let middleResult = compareHands(user1Board.slice(3, 8), user2Board.slice(3, 8));
    if (middleResult === 'user1') user1Points += 1;
    if (middleResult === 'user2') user2Points += 1;

    // Compare Bottom Row
    let bottomResult = compareHands(user1Board.slice(8, 13), user2Board.slice(8, 13));
    if (bottomResult === 'user1') user1Points += 1;
    if (bottomResult === 'user2') user2Points += 1;

    // Check for a scoop
    if (topResult === 'user1' && middleResult === 'user1' && bottomResult === 'user1') user1Points += 3; // Scoop bonus
    if (topResult === 'user2' && middleResult === 'user2' && bottomResult === 'user2') user2Points += 3; // Scoop bonus

    // Calculate royalties
    user1Points += calculateRoyalties(user1Board.slice(0, 3), 'top');
    user2Points += calculateRoyalties(user2Board.slice(0, 3), 'top');

    user1Points += calculateRoyalties(user1Board.slice(3, 8), 'middle');
    user2Points += calculateRoyalties(user2Board.slice(3, 8), 'middle');

    user1Points += calculateRoyalties(user1Board.slice(8, 13), 'bottom');
    user2Points += calculateRoyalties(user2Board.slice(8, 13), 'bottom');

    return {
        user1Points,
        user2Points
    };
}

// Serve static files
// app.use(express.static('public'));
app.use(express.static('.'));

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
        } else if(data.action === 'slotClick') {
            const { user, index} = data;

            // Get the appropriate board and the user's clicked count
            const board = gameState[`${user}Board`];
            const clickedCount = gameState[`${user}Clicked`];

            // Find the first empty slot in the chosen row
            let placed = false;
            if (gameState[`${user}SelectedCard`] != 0){
                board[index] = gameState[`${user}SelectedCard`];
                placed = true;
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
            } else {
                if (gameState.user2Clicked === 2) {
                    gameState.user2Finished = true;
                }
                if (gameState.user1Clicked === 2) {
                    gameState.user1Finished = true;
                }
                if (gameState.user1Clicked === 2 && gameState.user2Clicked === 2) {
                    if (gameState.user1ClickedTotal === 13 && gameState.user2ClickedTotal === 13) {
                        let points = computePoints(gameState.user1Board, gameState.user2Board);
                        const { user1Points, user2Points } = points;
                        gameState.user1Score = user1Points;
                        gameState.user2Score = user2Points;
                        gameState.gameEnded = true;
                    }
                    else {
                        dealCards();
                    }
                }
            }
        } else if(data.action === 'cardClick') {
            const { user, card, row } = data;

            gameState[`${user}SelectedCard`]  = card;
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
