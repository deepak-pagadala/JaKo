let score = 0;
let lives = 10;
let currentWord = "";
let currentJapaneseWord = "";
let wordText;
let fallingWord;
let correctWords = [];
let incorrectWords = [];
let totalWords = 0;
let wordSpeed = 0.5; // Initial falling speed
let repeatWordCounter = 0; // Counter to track when to reintroduce incorrect words
let isPaused = false;

const config = {
    type: Phaser.AUTO,
    width: 600,
    height: 400,
    parent: 'game-container',
    backgroundColor: '#ffffff',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

function preload() {
    console.log('Preloading assets...');
    // Preload any assets if needed
}

function create() {
    console.log('Creating game...');
    fetchAllWords();
}

function update() {
    if (!isPaused && fallingWord) {
        fallingWord.y += wordSpeed; // Speed of the falling word
        if (fallingWord.y > 400) { // Height of the game area
            lives--;
            document.getElementById('lives').textContent = lives;
            if (lives <= 0) {
                alert("Game Over!");
                resetGame();
            } else {
                showCorrectAnswer();
            }
        }
    }
}

function fetchAllWords() {
    fetch(`/get_all_words/${language}/${encodeURIComponent(category)}`)
        .then(response => response.json())
        .then(data => {
            const words = Object.keys(data).length; // Number of words fetched
            console.log('Total words in this category:', words); // Log total words to the console
            totalWords = words; // Assign to totalWords variable
            fetchWord();
        });
}

function fetchWord() {
    if (repeatWordCounter >= 2 && incorrectWords.length > 0) {
        // Reintroduce an incorrect word
        const wordData = incorrectWords.shift();
        currentWord = wordData.english;
        currentJapaneseWord = wordData.japanese;
        if (fallingWord) {
            fallingWord.destroy();
        }
        fallingWord = game.scene.scenes[0].add.text(300, 0, wordData.japanese, { font: '48px Arial', fill: '#000' }).setOrigin(0.5);
        speakWord(wordData.japanese);
        showRepeatLabel(true);
        repeatWordCounter = 0;
    } else {
        fetch(`/get_word/${language}/${encodeURIComponent(category)}`)
            .then(response => response.json())
            .then(data => {
                if (data.japanese && data.english) {
                    if (correctWords.includes(data.english)) {
                        fetchWord(); // Fetch another word if this one has been answered correctly before
                    } else {
                        currentWord = data.english;
                        currentJapaneseWord = data.japanese;
                        if (fallingWord) {
                            fallingWord.destroy();
                        }
                        fallingWord = game.scene.scenes[0].add.text(300, 0, data.japanese, { font: '48px Arial', fill: '#000' }).setOrigin(0.5);
                        speakWord(data.japanese);
                        showRepeatLabel(false);
                        console.log('Fetched word:', data.japanese);
                    }
                }
            });
        repeatWordCounter++;
    }
}

function normalizeText(text) {
    return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function checkAnswer() {
    const input = document.getElementById('answer-input');
    const answer = normalizeText(input.value);

    if (answer === "") {
        input.classList.add('incorrect');
        setTimeout(() => {
            input.classList.remove('incorrect');
        }, 500); // Briefly indicate incorrect input
        return; // Ignore empty input
    }

    const normalizedCurrentWord = normalizeText(currentWord);
    if (answer === normalizedCurrentWord) {
        input.classList.add('correct');
        score++;
        document.getElementById('score').textContent = score;
        correctWords.push(currentWord);
        wordSpeed *= 1.05; // Increase speed by 10%
        if (correctWords.length === totalWords) {
            showCongratsMessage();
        } else {
            setTimeout(fetchWord, 500); // Fetch next word after a short delay
        }
    } else {
        input.classList.add('incorrect');
        lives--;
        document.getElementById('lives').textContent = lives;
        if (lives <= 0) {
            alert("Game Over!");
            resetGame();
        } else {
            incorrectWords.push({ japanese: fallingWord.text, english: currentWord });
            showCorrectAnswer();
        }
    }
    input.value = '';
    input.classList.remove('correct', 'incorrect');
}

function showCorrectAnswer() {
    isPaused = true;
    const correctAnswerDiv = document.createElement('div');
    correctAnswerDiv.id = 'correct-answer';
    correctAnswerDiv.innerHTML = `<p>Correct Answer: ${currentJapaneseWord} - ${currentWord}</p>`;
    correctAnswerDiv.style.position = 'absolute';
    correctAnswerDiv.style.top = '50%';
    correctAnswerDiv.style.left = '50%';
    correctAnswerDiv.style.transform = 'translate(-50%, -50%)';
    correctAnswerDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    correctAnswerDiv.style.color = '#fff';
    correctAnswerDiv.style.padding = '20px';
    correctAnswerDiv.style.borderRadius = '10px';
    correctAnswerDiv.style.zIndex = '1000';
    document.getElementById('game-container').appendChild(correctAnswerDiv);

    // Speak the original word
    speakWord(currentJapaneseWord);

    setTimeout(() => {
        correctAnswerDiv.remove();
        isPaused = false;
        fetchWord();
    }, 3000); // Show correct answer for 3 seconds
}

function speakWord(word) {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = language === 'japanese' ? 'ja-JP' : 'ko-KR';
    window.speechSynthesis.speak(utterance);
}

function showRepeatLabel(isRepeat) {
    const repeatLabel = document.getElementById('repeat-label');
    if (isRepeat) {
        repeatLabel.style.display = 'block';
    } else {
        repeatLabel.style.display = 'none';
    }
}

function showCongratsMessage() {
    if (fallingWord) {
        fallingWord.destroy();
    }
    game.scene.scenes[0].add.text(300, 200, `Congrats! You have learned ${category}!`, { font: '32px Arial', fill: '#000' }).setOrigin(0.5);
    setTimeout(() => {
        resetGame();
        window.location.href = `/category/${language}`;
    }, 3000); // Redirect to category selection after 3 seconds
}

function resetGame() {
    score = 0;
    lives = 10;
    wordSpeed = 0.5; // Reset speed
    correctWords = [];
    incorrectWords = [];
    repeatWordCounter = 0;
    isPaused = false;
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    fetchWord();
}

document.getElementById('submit-btn').addEventListener('click', checkAnswer);
document.getElementById('answer-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        checkAnswer();
    }
});
document.getElementById('reset-btn').addEventListener('click', resetGame);

window.onload = () => {
    fetchWord();
};
