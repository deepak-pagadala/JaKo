from flask import Flask, render_template, request, jsonify
import random
import json
import os

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
    return render_template('game.html', language=language, category=category)

@app.route('/get_word/<language>/<category>')
def get_word(language, category):
    # Implement logic to fetch a word from JSON files
    with open(f'vocabularies/{language}.json', encoding='utf-8') as f:
        data = json.load(f)
        words = data.get(category, {})
        # Choose a word at random or implement logic to select the word
        word = random.choice(list(words.items()))
        return jsonify(word)

@app.route('/get_all_words/<language>/<category>')
def get_all_words(language, category):
    # Implement logic to fetch all words from JSON files
    with open(f'vocabularies/{language}.json', encoding='utf-8') as f:
        data = json.load(f)
        words = data.get(category, {})
        return jsonify(words)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=os.getenv('PORT', 5000))
