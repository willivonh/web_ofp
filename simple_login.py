from flask import Flask, render_template, redirect, url_for

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

if __name__ == '__main__':
    simple_login .run(host='0.0.0.0', port=5001)
