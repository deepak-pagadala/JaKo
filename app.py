from flask import Flask, render_template, request, jsonify
import random
import json
import os
import urllib.parse

app = Flask(__name__)

# Load vocabularies
def load_vocab(language):
    vocab_path = os.path.join(os.path.dirname(__file__), 'vocabularies', f'{language}.json')
    with open(vocab_path, encoding='utf-8') as f:
        return json.load(f)

vocab_data = {
    'japanese': load_vocab('japanese'),
    'korean': load_vocab('korean')
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/language')
def language():
    return render_template('language.html')

@app.route('/category/<language>')
def category(language):
    return render_template('category.html', language=language)

@app.route('/game/<language>/<category>')
def game(language, category):
    decoded_category = urllib.parse.unquote(category)
    return render_template('game.html', language=language, category=decoded_category)

@app.route('/get_all_words/<language>/<category>', methods=['GET'])
def get_all_words(language, category):
    vocab = vocab_data.get(language, {}).get(category, {})
    return jsonify(vocab)

@app.route('/get_word/<language>/<category>', methods=['GET'])
def get_word(language, category):
    vocab = vocab_data.get(language, {}).get(category, {})
    if vocab:
        words = list(vocab.items())
        japanese, english = random.choice(words)
        incorrect_options = random.sample([v for k, v in words if v != english], 3)
        options = incorrect_options + [english]
        random.shuffle(options)
        return jsonify({'japanese': japanese, 'english': english, 'options': options})
    return jsonify({})

if __name__ == '__main__':
    app.run(debug=True)
