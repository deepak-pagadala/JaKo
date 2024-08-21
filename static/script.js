let score = 0;
let lives = 3;
let currentWords = [];
let fallingWords = [];
let correctWords = [];
let incorrectWords = [];
let totalWords = 0;
let wordSpeed = 0.4; // Falling speed
let repeatWordCounter = 0; // Counter to track when to reintroduce incorrect words
let isPaused = false;
let wordsToDrop = 1; // Number of words to drop at a time
let wordDropDelay = 2000; // Delay in milliseconds between dropping words
let answeredWords = []; // Keep track of correctly answered words in the current set

let characterX = 0; // Initial X position of the character
const characterStep = (window.innerWidth - 100) / 7; // Total distance divided by 7
const characterAnimationDuration = 3800; // Duration of movement animation in milliseconds

let standingImage = language === 'japanese' ? '/static/images/characters/panda.png' : '/static/images/characters/tiger.png';
let movingGif = language === 'japanese' ? '/static/images/characters/panda_moving.gif' : '/static/images/characters/tiger_moving.gif';

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight - 200, // Adjust height for header and footer
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
    game.scale.resize(window.innerWidth, window.innerHeight - 300);
});

function preload() {
    console.log('Preloading assets...');
}

function create() {
    console.log('Creating game...');
    fetchAllWords();
    document.getElementById('character').style.left = `${characterX}px`;
    document.getElementById('character').src = standingImage;
    const backgroundMusic = document.getElementById('background-music');
    backgroundMusic.play();
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
                    fallingWord.destroy();
                    fallingWords[index] = null;
                }
            }
        });
    }
}

function updateLivesDisplay() {
    const lifeImage = language === 'japanese' ? '/static/images/lives/bamboo.png' : '/static/images/lives/crown.png';
    const emptyLifeImage = language === 'japanese' ? '/static/images/lives/bamboo_lost.png' : '/static/images/lives/crown_lost.png';
    for (let i = 1; i <= 3; i++) {
        document.getElementById(`heart${i}`).src = i <= lives ? lifeImage : emptyLifeImage;
    }
}

function fetchAllWords() {
    fetch(`/get_all_words/${language}/${encodeURIComponent(category)}`)
        .then(response => response.json())
        .then(data => {
            const words = Object.keys(data).length;
            console.log('Total words in this category:', words);
            totalWords = words;
            fetchWords();
        });
}

function fetchWords() {
    if (isPaused) return;

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
                const wordData = incorrectWords.shift();
                currentWords.push(wordData);
                addFallingWord(wordData.japanese, wordData.english);
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
                            } else {
                                addFallingWord(data.english, data.japanese);
                            }
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
    const x = Phaser.Math.Between(100, game.config.width - 100);
    textObj.setPosition(x, 0);

    textObj.setInteractive();
    textObj.on('pointerdown', () => {
        speakWord(word);
    });

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
        }, 500);
        return;
    }

    const normalizedCurrentWords = currentWords.map(word => normalizeText(mode === 'english' ? word.english : word.japanese));
    const index = normalizedCurrentWords.indexOf(answer);

    if (index !== -1) {
        input.classList.add('correct');
        setTimeout(() => {
            input.classList.remove('correct');
        }, 500);
        answeredWords.push(currentWords[index]);
        fallingWords[index].destroy();
        fallingWords[index] = null;
        currentWords.splice(index, 1);
        fallingWords.splice(index, 1);
        input.value = '';

        moveCharacter(); // Move the character on correct answer

        if (answeredWords.length === wordsToDrop) {
            score++;
            document.getElementById('score').textContent = `Score: ${score}`;
            correctWords.push(...answeredWords);
            if (score !== 0 && score % 7 === 0) {
                showLevelUpNotification();
            } else {
                setTimeout(fetchWords, 500);
            }
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

function moveCharacter() {
    const character = document.getElementById('character');
    character.src = movingGif; // Set to moving GIF
    character.style.width = '100px';
    character.style.height = '100px';
    
    const newPosition = characterX + characterStep;
    
    character.style.transition = `left ${characterAnimationDuration}ms ease-in-out`;
    character.style.left = `${newPosition}px`;

    setTimeout(() => {
        character.src = standingImage; // Revert to standing image
        character.style.width = '100px';
        character.style.height = '100px';
    }, characterAnimationDuration); 
    
    characterX = newPosition; // Update the character's position
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

    currentWords.forEach(word => speakWord(mode === 'english' ? word.japanese : word.english));

    setTimeout(() => {
        correctAnswerDiv.remove();
        isPaused = false;
        fetchWords();
    }, 3000);
}

function showLevelUpNotification() {
    isPaused = true;
    const levelUpDiv = document.getElementById('level-up-notification');
    levelUpDiv.style.display = 'block';
    setTimeout(() => {
        levelUpDiv.style.display = 'none';
        wordsToDrop *= 2;
        isPaused = false;
        fetchWords();
    }, 3000);
}

function speakWord(word) {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = language === 'japanese' ? 'ja-JP' : 'ko-KR';
    window.speechSynthesis.speak(utterance);
}

function resetGame() {
    score = 0;
    lives = 3;
    wordSpeed = 0.4;
    wordsToDrop = 1;
    correctWords = [];
    incorrectWords = [];
    repeatWordCounter = 0;
    answeredWords = [];
    isPaused = false;
    characterX = 0; // Reset character position
    document.getElementById('character').src = standingImage; // Reset to standing image
    document.getElementById('character').style.left = `${characterX}px`; // Move character to starting position
    document.getElementById('score').textContent = `Score: ${score}`;
    updateLivesDisplay();
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
