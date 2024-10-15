from flask import Flask, render_template, request, redirect, session, url_for

clickable = Flask(__name__)
clickable.secret_key = 'your_secret_key'


# Route for the home/login page
@clickable.route('/', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Get the player selection from the form
        player = request.form.get('player')

        # Store player information in session
        if player:
            session['player'] = player
            session['player1_clickable'] = True  # Player 1's button is clickable
            session['player2_clickable'] = True  # Player 2's button is clickable
            return redirect(url_for('game'))

    return render_template('login_clickable.html')


# Route for the game page
@clickable.route('/game', methods=['GET', 'POST'])
def game():
    if 'player' not in session:
        return redirect(url_for('login_clickable'))

    # Handle button click interaction
    if request.method == 'POST':
        if session['player'] == 'player1':
            session['player1_clickable'] = False  # Disable Player 1's button
        elif session['player'] == 'player2':
            session['player2_clickable'] = False  # Disable Player 2's button

    # Pass button states to the template
    return render_template('game.html',
                           player=session['player'],
                           player1_clickable=session['player1_clickable'],
                           player2_clickable=session['player2_clickable'])


# Route to reset the game (optional)
@clickable.route('/reset')
def reset():
    session['player1_clickable'] = True
    session['player2_clickable'] = True
    return redirect(url_for('game'))


if __name__ == '__main__':
    clickable.run(host='0.0.0.0', port=5001)
