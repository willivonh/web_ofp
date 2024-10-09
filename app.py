from flask import Flask, jsonify
import random

app = Flask(__name__)

@app.route('/generate-numbers', methods=['GET'])
def generate_numbers():
    # Generate 5 random numbers between 1 and 12
    random_numbers = [random.randint(1, 12) for _ in range(5)]
    return jsonify(random_numbers)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
