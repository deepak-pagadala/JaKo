let score = 0;
let lives = 3;
let currentWords = [];
let fallingWords = [];
let correctWords = [];
let incorrectWords = [];
let totalWords = 0;
let wordSpeed = 0.5; // Falling speed
let repeatWordCounter = 0; // Counter to track when to reintroduce incorrect words
let isPaused = false;
let wordsToDrop = 1; // Number of words to drop at a time
let wordDropDelay = 2000; // Delay in milliseconds between dropping words
let answeredWords = []; // Keep track of correctly answered words in the current set

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth - 150,
    height: window.innerHeight - 250, // Adjust height for header and footer
    parent: 'game-container',
    transparent: true, // Make the game background transparent
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight - 250);
});

function preload() {
    console.log('Preloading assets...');
    // Preload any assets if needed
}

function create() {
    console.log('Creating game...');
    fetchAllWords();
}

function update() {
    if (!isPaused) {
        fallingWords.forEach((fallingWord, index) => {
            if (fallingWord) {
                fallingWord.y += wordSpeed; // Speed of the falling word
                if (fallingWord.y > game.config.height) { // Height of the game area
                    lives--;
                    updateLivesDisplay();
                    if (lives <= 0) {
                        alert("Game Over!");
                        resetGame();
                    } else {
                        showCorrectAnswer();
                    }
                    // Remove the word that reached the bottom
                    fallingWord.destroy();
                    fallingWords[index] = null;
                }
            }
        });
    }
}

function updateLivesDisplay() {
    for (let i = 1; i <= 3; i++) {
        document.getElementById(`heart${i}`).src = i <= lives ? '/static/heart-full.png' : '/static/heart-empty.png';
    }
}

function fetchAllWords() {
    fetch(`/get_all_words/${language}/${encodeURIComponent(category)}`)
        .then(response => response.json())
        .then(data => {
            const words = Object.keys(data).length; // Number of words fetched
            console.log('Total words in this category:', words); // Log total words to the console
            totalWords = words; // Assign to totalWords variable
            fetchWords();
        });
}

function fetchWords() {
    currentWords = [];
    answeredWords = [];
    fallingWords.forEach(fallingWord => {
        if (fallingWord) {
            fallingWord.destroy();
        }
    });
    fallingWords = [];

    let fetchWordIndex = 0;
    function fetchNextWord() {
        if (fetchWordIndex < wordsToDrop) {
            if (repeatWordCounter >= 2 && incorrectWords.length > 0) {
                // Reintroduce an incorrect word
                const wordData = incorrectWords.shift();
                currentWords.push(wordData);
                addFallingWord(wordData.japanese, wordData.english);
                speakWord(wordData.japanese);
                showRepeatLabel(true);
                fetchWordIndex++;
                setTimeout(fetchNextWord, wordDropDelay);
            } else {
                fetch(`/get_word/${language}/${encodeURIComponent(category)}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.japanese && data.english) {
                            currentWords.push(data);
                            if (mode === 'english') {
                                addFallingWord(data.japanese, data.english);
                                speakWord(data.japanese);
                            } else {
                                addFallingWord(data.english, data.japanese);
                                speakWord(data.english);
                            }
                            showRepeatLabel(false);
                            console.log('Fetched word:', data.japanese);
                            fetchWordIndex++;
                            setTimeout(fetchNextWord, wordDropDelay);
                        }
                    });
            }
        }
    }
    fetchNextWord();
    repeatWordCounter++;
}

function addFallingWord(word, translation) {
    const textObj = game.scene.scenes[0].add.text(0, 0, word, { font: '28px Press Start 2P', fill: '#fff' });
    const textWidth = textObj.width;
    const x = Phaser.Math.Between(100, game.config.width - 100);
    textObj.setPosition(x, 0);
    fallingWords.push(textObj);
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

    const normalizedCurrentWords = currentWords.map(word => normalizeText(mode === 'english' ? word.english : word.japanese));
    const index = normalizedCurrentWords.indexOf(answer);

    if (index !== -1) {
        input.classList.add('correct');
        setTimeout(() => {
            input.classList.remove('correct');
        }, 500); // Briefly indicate correct input
        answeredWords.push(currentWords[index]);
        fallingWords[index].destroy();
        fallingWords[index] = null;
        currentWords.splice(index, 1);
        fallingWords.splice(index, 1);
        input.value = '';

        if (answeredWords.length === wordsToDrop) {
            score++;
            document.getElementById('score').textContent = `Score: ${score}`;
            correctWords.push(...answeredWords);
            if (score !== 0 && score % 2 === 0) { // Double the wordsToDrop after every 2 correct answers
                wordsToDrop *= 2;
            }
            setTimeout(fetchWords, 500); // Fetch next words after a short delay
        }
    } else {
        input.classList.add('incorrect');
        lives--;
        updateLivesDisplay();
        if (lives <= 0) {
            alert("Game Over!");
            resetGame();
        } else {
            incorrectWords.push(...currentWords);
            showCorrectAnswer();
        }
        input.value = '';
        input.classList.remove('correct', 'incorrect');
    }
}

function showCorrectAnswer() {
    isPaused = true;
    const correctAnswerDiv = document.createElement('div');
    correctAnswerDiv.id = 'correct-answer';
    correctAnswerDiv.innerHTML = `<p>Correct Answer: ${currentWords.map(word => `${word.japanese} - ${word.english}`).join(', ')}</p>`;
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

    // Speak the original words
    currentWords.forEach(word => speakWord(mode === 'english' ? word.japanese : word.english));

    setTimeout(() => {
        correctAnswerDiv.remove();
        isPaused = false;
        fetchWords();
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

function resetGame() {
    score = 0;
    lives = 3;
    wordSpeed = 0.5; // Reset speed
    wordsToDrop = 1; // Reset the number of words to drop
    correctWords = [];
    incorrectWords = [];
    repeatWordCounter = 0;
    answeredWords = []; // Reset answered words
    isPaused = false;
    document.getElementById('score').textContent = `Score: ${score}`;
    updateLivesDisplay(); // Ensure lives are displayed as hearts
    fetchWords();
}

document.getElementById('submit-btn').addEventListener('click', checkAnswer);
document.getElementById('answer-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        checkAnswer();
    }
});
document.getElementById('reset-btn').addEventListener('click', resetGame);

window.onload = () => {
    fetchWords();
};
