from flask import Flask, jsonify, send_from_directory
import random
import os

app = Flask(__name__)

# Serve the frontend (index.html)
@app.route('/')
def serve_frontend():
    return send_from_directory('static', 'index.html')

# API endpoint to generate random numbers
@app.route('/generate-numbers', methods=['GET'])
def generate_numbers():
    random_numbers = [random.randint(1, 12) for _ in range(5)]
    return jsonify(random_numbers)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
