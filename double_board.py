from flask import Flask, render_template, request, redirect, session, jsonify

double_board = Flask(__name__)
double_board.secret_key = 'your_secret_key'


# Deck generation logic
def generate_deck():
    deck = [str(i) + suit for i in range(2, 15) for suit in ['H', 'D', 'C', 'S']]
    random.shuffle(deck)
    return deck


# Route for the home/login page
@double_board.route('/', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        player = request.form.get('player')
        if player:
            session['player'] = player
            if 'deck' not in session:
                session['deck'] = generate_deck()  # Shared deck for both players
            if 'player1_board' not in session:
                session['player1_board'] = []  # Board for Player 1
            if 'player2_board' not in session:
                session['player2_board'] = []  # Board for Player 2
            return redirect('/game')
    return render_template('double_login.html')


# Route for the game page
@double_board.route('/game')
def game():
    if 'player' not in session:
        return redirect('/')

    return render_template('double_game.html', player=session['player'])


# Route to deal cards to each player
@double_board.route('/deal-cards')
def deal_cards():
    if 'deck' not in session:
        return redirect('/')

    # Draw 5 cards for each hand from the shared deck
    deck = session['deck']
    hand1 = deck[:5]  # First 5 cards for Player 1
    hand2 = deck[5:10]  # Next 5 cards for Player 2
    session['deck'] = deck[10:]  # Remove the dealt cards from the deck

    return jsonify({
        'hand1': hand1,
        'hand2': hand2,
        'cards_left': len(session['deck'])
    })


# Route to reset the game (optional)
@double_board.route('/reset')
def reset():
    session['deck'] = generate_deck()
    session['player1_board'] = []
    session['player2_board'] = []
    return redirect('/game')


if __name__ == '__main__':
    double_board.run(host='0.0.0.0', port=5001)
