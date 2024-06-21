from flask import Flask, render_template, jsonify, request
import json
import random

app = Flask(__name__)

with open('vocabularies/japanese.json', 'r', encoding='utf-8') as f:
    japanese_vocab = json.load(f)

with open('vocabularies/korean.json', 'r', encoding='utf-8') as f:
    korean_vocab = json.load(f)

@app.route('/')
def language_selection():
    return render_template('language_selection.html')

@app.route('/category/<language>')
def category_selection(language):
    return render_template('category.html', language=language)

@app.route('/mode/<language>/<category>')
def mode_selection(language, category):
    return render_template('mode_selection.html', language=language, category=category)

@app.route('/game/<language>/<category>/<mode>')
def game(language, category, mode):
    return render_template('game.html', language=language, category=category, mode=mode)

@app.route('/get_all_words/<language>/<category>')
def get_all_words(language, category):
    if language == 'japanese':
        vocab = japanese_vocab
    else:
        vocab = korean_vocab
    return jsonify(vocab[category])

@app.route('/get_word/<language>/<category>')
def get_word(language, category):
    if language == 'japanese':
        vocab = japanese_vocab
    else:
        vocab = korean_vocab
    word = random.choice(list(vocab[category].items()))
    return jsonify({'japanese': word[0], 'english': word[1]})

if __name__ == '__main__':
    app.run(debug=True)
