from flask import Flask, jsonify, send_from_directory
import random

app = Flask(__name__)

# Serve the frontend (index.html) from the docs folder
@app.route('/')
def serve_frontend():
    return send_from_directory('docs', 'index.html')

@app.route('/generate-new-numbers')
def generate_new_numbers():
    # Generate a list of 5 new random numbers
    numbers = [random.randint(1, 12) for _ in range(5)]
    return jsonify({'numbers': numbers})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
