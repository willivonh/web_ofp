from flask import Flask, jsonify, render_template
import random

simple_login = Flask(__name__)

# Route for the home page with Player 1 and Player 2 buttons
@simple_login.route('/')
def home():
    return render_template('login.html')

# Route for Player 1
@simple_login.route('/player1')
def player1():
    return render_template('player1.html')

# Route for Player 2
@simple_login.route('/player2')
def player2():
    return render_template('player2.html')

# Initialize the deck of cards
deck = []

@simple_login.route('/initialize_deck')
def initialize_deck():
    global deck
    suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades']
    ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
    deck = [f'{rank} of {suit}' for rank in ranks for suit in suits]
    random.shuffle(deck)

initialize_deck()

@simple_login.route('/get-cards')
def get_cards():
    global deck
    if len(deck) >= 5:
        # Return 5 cards and remove them from the deck
        cards = [deck.pop() for _ in range(5)]
        return jsonify({'cards': cards, 'cards_left': len(deck)})
    elif 0 < len(deck) < 5:
        # If fewer than 5 cards are left, return remaining cards
        cards = [deck.pop() for _ in range(len(deck))]
        return jsonify({'cards': cards, 'cards_left': 0})
    else:
        # No more cards in the deck
        return jsonify({'message': 'No more cards left in the deck'})

if __name__ == '__main__':
    simple_login .run(host='0.0.0.0', port=5001)
