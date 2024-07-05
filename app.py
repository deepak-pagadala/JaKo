from flask import Flask, render_template, jsonify, request
import json
import random
import urllib.parse
import logging

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)

with open('vocabularies/japanese.json', 'r', encoding='utf-8') as f:
    japanese_vocab = json.load(f)

with open('vocabularies/korean.json', 'r', encoding='utf-8') as f:
    korean_vocab = json.load(f)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/language')
def language():
    return render_template('language.html')

@app.route('/category/<language>')
def category(language):
    return render_template('category.html', language=language)

@app.route('/mode/<language>/<category>')
def mode_selection(language, category):
    try:
        decoded_category = urllib.parse.unquote(category)
        return render_template('mode_selection.html', language=language, category=decoded_category)
    except Exception as e:
        app.logger.error(f"Error in mode_selection: {e}")
        return "An error occurred", 500

@app.route('/rules/<language>/<category>/<mode>')
def rules(language, category, mode):
    try:
        decoded_category = urllib.parse.unquote(category)
        return render_template('rules.html', language=language, category=decoded_category, mode=mode)
    except Exception as e:
        app.logger.error(f"Error in rules: {e}")
        return "An error occurred", 500

@app.route('/game/<language>/<category>/<mode>')
def game(language, category, mode):
    try:
        decoded_category = urllib.parse.unquote(category)
        return render_template('game.html', language=language, category=decoded_category, mode=mode)
    except Exception as e:
        app.logger.error(f"Error in game: {e}")
        return "An error occurred", 500

@app.route('/get_all_words/<language>/<category>')
def get_all_words(language, category):
    try:
        decoded_category = urllib.parse.unquote(category)
        if language == 'japanese':
            vocab = japanese_vocab
        else:
            vocab = korean_vocab
        if decoded_category in vocab:
            return jsonify(vocab[decoded_category])
        else:
            return jsonify({"error": "Category not found"}), 404
    except Exception as e:
        app.logger.error(f"Error in get_all_words: {e}")
        return "An error occurred", 500

@app.route('/get_word/<language>/<category>')
def get_word(language, category):
    try:
        decoded_category = urllib.parse.unquote(category)
        if language == 'japanese':
            vocab = japanese_vocab
        else:
            vocab = korean_vocab
        if decoded_category in vocab:
            word = random.choice(list(vocab[decoded_category].items()))
            return jsonify({'japanese': word[0], 'english': word[1]})
        else:
            return jsonify({"error": "Category not found"}), 404
    except Exception as e:
        app.logger.error(f"Error in get_word: {e}")
        return "An error occurred", 500

if __name__ == '__main__':
    app.run(debug=True)
