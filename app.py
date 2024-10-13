from flask import Flask, jsonify, send_from_directory
import random

app = Flask(__name__)

# Serve the frontend (index.html) from the docs folder
@app.route('/')
def serve_frontend():
    return send_from_directory('docs', 'index.html')

# Initialize the deck of cards
deck = []

def initialize_deck():
    global deck
    suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades']
    ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
    deck = [f'{rank} of {suit}' for rank in ranks for suit in suits]
    random.shuffle(deck)

initialize_deck()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get-cards')
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
    app.run(host='0.0.0.0', port=5001)
