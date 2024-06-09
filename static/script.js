let score = 0;
let lives = 10;
let currentWords = [];
let fallingWords = [];
let correctWords = [];
let incorrectWords = [];
let totalWords = 0;
let wordSpeed = 0.2; // Reduced initial falling speed
let repeatWordCounter = 0; // Counter to track when to reintroduce incorrect words
let isPaused = false;
let wordsToDrop = 1; // Number of words to drop at a time
let wordDropDelay = 3000; // Increased delay in milliseconds between dropping words
let usedWords = []; // Keep track of used words to avoid repetition in the same set

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
    if (!isPaused) {
        fallingWords.forEach((fallingWord, index) => {
            if (fallingWord) {
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
                    // Remove the word that reached the bottom
                    fallingWord.destroy();
                    fallingWords[index] = null;
                }
            }
        });
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
    fallingWords.forEach(fallingWord => {
        if (fallingWord) {
            fallingWord.destroy();
        }
    });
    fallingWords = [];
    usedWords = [];

    let fetchWordIndex = 0;
    function fetchNextWord() {
        if (fetchWordIndex < wordsToDrop) {
            if (repeatWordCounter >= 2 && incorrectWords.length > 0) {
                // Reintroduce an incorrect word
                const wordData = incorrectWords.shift();
                currentWords.push(wordData);
                fallingWords.push(game.scene.scenes[0].add.text(300, 0, wordData.japanese, { font: '48px Arial', fill: '#000' }).setOrigin(0.5));
                speakWord(wordData.japanese);
                showRepeatLabel(true);
                fetchWordIndex++;
                setTimeout(fetchNextWord, wordDropDelay);
            } else {
                fetch(`/get_word/${language}/${encodeURIComponent(category)}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.japanese && data.english) {
                            if (correctWords.some(word => word.english === data.english) || usedWords.includes(data.english)) {
                                fetchNextWord(); // Fetch another word if this one has been answered correctly before or is used in this set
                            } else {
                                currentWords.push(data);
                                fallingWords.push(game.scene.scenes[0].add.text(300, 0, data.japanese, { font: '48px Arial', fill: '#000' }).setOrigin(0.5));
                                speakWord(data.japanese);
                                showRepeatLabel(false);
                                usedWords.push(data.english); // Track used words in the current set
                                console.log('Fetched word:', data.japanese);
                                fetchWordIndex++;
                                setTimeout(fetchNextWord, wordDropDelay);
                            }
                        }
                    });
            }
        }
    }
    fetchNextWord();
    repeatWordCounter++;
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

    const answers = answer.split(',').map(normalizeText);
    const normalizedCurrentWords = currentWords.map(word => normalizeText(word.english));
    const correctAnswers = answers.every(ans => normalizedCurrentWords.includes(ans));
    const allAnswered = normalizedCurrentWords.every(word => answers.includes(word));

    if (correctAnswers && allAnswered) {
        input.classList.add('correct');
        score++;
        document.getElementById('score').textContent = score;
        correctWords.push(...currentWords);
        wordSpeed = 0.2; // Reset speed to normal
        if (correctWords.length === totalWords) {
            showCongratsMessage();
        } else {
            if (score !== 0 && score % 5 === 0) { // Ensure wordsToDrop increases only when score is a non-zero multiple of 5
                wordsToDrop++;
            }
            setTimeout(fetchWords, 500); // Fetch next words after a short delay
        }
    } else {
        input.classList.add('incorrect');
        lives--;
        document.getElementById('lives').textContent = lives;
        if (lives <= 0) {
            alert("Game Over!");
            resetGame();
        } else {
            incorrectWords.push(...currentWords);
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
    currentWords.forEach(word => speakWord(word.japanese));

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

function showCongratsMessage() {
    if (fallingWords) {
        fallingWords.forEach(fallingWord => {
            if (fallingWord) {
                fallingWord.destroy();
            }
        });
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
    wordSpeed = 0.2; // Reset speed
    wordsToDrop = 1; // Reset the number of words to drop
    correctWords = [];
    incorrectWords = [];
    repeatWordCounter = 0;
    usedWords = []; // Reset used words
    isPaused = false;
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
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
