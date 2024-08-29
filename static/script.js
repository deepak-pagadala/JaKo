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
<<<<<<< HEAD
let setInProgress = false; // Track if a set is in progress
let movementCount = 0; // Track how many times the character has moved in a set

let characterX = 0; // Initial X position of the character
const screenWidth = window.innerWidth - 100; // Screen width minus character width
let characterStep; // Will be calculated based on wordsToDrop
const characterAnimationDuration = 650; // Duration of movement animation in milliseconds
=======

let characterX = 0; // Initial X position of the character
const screenWidth = window.innerWidth - 100; // Screen width minus character width
const characterStep = screenWidth / 7; // Total distance divided by 7
const characterAnimationDuration = 2000; // Duration of movement animation in milliseconds
>>>>>>> parent of 80aecb5 (changes)
let movingRight = true; // Track the direction of the character

let standingImage = language === 'japanese' ? '/static/images/characters/panda.png' : '/static/images/characters/tiger.png';
let movingGif = language === 'japanese' ? '/static/images/characters/panda_moving.gif' : '/static/images/characters/tiger_moving.gif';

let objectImage = language === 'japanese' ? '/static/images/lives/bamboo.png' : '/static/images/lives/crown.png'; // Object to be caught by character
let objectX = screenWidth; // Initial X position of the object

const config = {
    type: Phaser.AUTO,
    width: screenWidth + 100, // Adjust width to account for character size
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
    game.scale.resize(screenWidth + 100, window.innerHeight - 300);
});

function preload() {
    console.log('Preloading assets...');
}

function create() {
    console.log('Creating game...');
    fetchAllWords();
    document.getElementById('character').style.left = `${characterX}px`;
    document.getElementById('character').src = standingImage;

    // Set initial object position
    document.getElementById('object').style.left = `${objectX}px`;
    document.getElementById('object').src = objectImage;

    // Play background music
    const backgroundMusic = document.getElementById('background-music');
    backgroundMusic.volume = 0.075; // Set volume to 5%
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
                    playWrongAnswerSound(); // Play wrong answer sound
                    if (lives <= 0) {
<<<<<<< HEAD
                        showGameOverScreen(); // Show game over screen
=======
                        alert("Game Over!");
                        resetGame();
                    } else {
                        showCorrectAnswer();
>>>>>>> parent of 80aecb5 (changes)
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
<<<<<<< HEAD
    characterStep = screenWidth / wordsToDrop; // Calculate character step based on words to drop
    setInProgress = true; // Mark the start of a new set
    movementCount = 0; // Reset movement count

=======
>>>>>>> parent of 80aecb5 (changes)
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

function speakWord(word) {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = language === 'japanese' ? 'ja-JP' : 'ko-KR';
    window.speechSynthesis.speak(utterance);
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

<<<<<<< HEAD
        moveCharacter(() => {
            movementCount++; // Increment movement count
            if (answeredWords.length === wordsToDrop) {
                score++;
                document.getElementById('score').textContent = `Score: ${score}`;
                correctWords.push(...answeredWords);
                setInProgress = false; // Mark the end of the current set

                // Increase falling speed by 5% every 3 levels
                if (score % 3 === 0) {
                    wordSpeed += wordSpeed * 0.5;
                }

                if (movementCount === wordsToDrop) { // Ensure character completes its movement
                    flipCharacter(); // Flip the character after completing the movement
                    moveObject(); // Move the object to the opposite side
                    wordsToDrop += 2; // Increase words dropping by 2 after each level up
                    showLevelUpNotification();
                }
            }
        }); // Move the character on each correct answer
=======
        if (answeredWords.length === wordsToDrop) {
            score++;
            document.getElementById('score').textContent = `Score: ${score}`;
            correctWords.push(...answeredWords);

            moveCharacter(); // Move the character on correct answer

            if (score % 7 === 0) { // Show level-up notification after 7 correct answers
                moveObject(); // Move the object to the opposite side
                showLevelUpNotification();
            } else {
                setTimeout(fetchWords, 500);
            }
        }
>>>>>>> parent of 80aecb5 (changes)
    } else {
        input.classList.add('incorrect');
        playWrongAnswerSound(); // Play wrong answer sound
        lives--;
        updateLivesDisplay();
        if (lives <= 0) {
<<<<<<< HEAD
            showGameOverScreen(); // Show game over screen
=======
            alert("Game Over!");
            resetGame();
        } else {
            incorrectWords.push(...currentWords);
            showCorrectAnswer();
>>>>>>> parent of 80aecb5 (changes)
        }
        input.value = '';
        input.classList.remove('correct', 'incorrect');
    }
}

function moveCharacter(callback) {
    const character = document.getElementById('character');
    character.src = movingGif; // Set to moving GIF
    character.style.width = '100px';
    character.style.height = '100px';

    let newPosition = movingRight ? characterX + characterStep : characterX - characterStep;

    // Ensure the character does not go beyond the screen boundaries
    if (newPosition > screenWidth) {
        newPosition = screenWidth;
    } else if (newPosition < 0) {
        newPosition = 0;
    }

    character.style.transition = `left ${characterAnimationDuration}ms ease-in-out`;
    character.style.left = `${newPosition}px`;

    setTimeout(() => {
        character.src = standingImage; // Revert to standing image
        character.style.width = '100px';
        character.style.height = '100px';

        characterX = newPosition; // Update the character's position

        callback(); // Call the callback after movement is complete
    }, characterAnimationDuration);
}

function moveObject() {
    objectX = movingRight ? screenWidth : 0; // Move object to the opposite side
    const object = document.getElementById('object');
    object.style.transition = `left ${characterAnimationDuration}ms ease-in-out`;
    object.style.left = `${objectX}px`; // Update the object's position
}

function flipCharacter() {
    const character = document.getElementById('character');
    movingRight = !movingRight;
    character.style.transform = movingRight ? 'scaleX(1)' : 'scaleX(-1)';
}

<<<<<<< HEAD
function playWrongAnswerSound() {
    const wrongAnswerSound = new Audio('/static/audio/wrongans.mp3');
    wrongAnswerSound.volume = 0.03
    wrongAnswerSound.play();
=======

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
>>>>>>> parent of 80aecb5 (changes)
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

function resetGame() {
    score = 0;
    lives = 3;
<<<<<<< HEAD
    wordSpeed = 0.5;
    wordsToDrop = 5; // Reset to 5 words dropping at a time
=======
    wordSpeed = 0.4;
    wordsToDrop = 1;
>>>>>>> parent of 80aecb5 (changes)
    correctWords = [];
    incorrectWords = [];
    repeatWordCounter = 0;
    answeredWords = [];
    isPaused = false;
    characterX = 0;
    movingRight = true;
    objectX = screenWidth;
    document.getElementById('character').src = standingImage;
    document.getElementById('character').style.left = `${characterX}px`;
    document.getElementById('character').style.transform = 'scaleX(1)';
    document.getElementById('object').style.left = `${objectX}px`;
    document.getElementById('score').textContent = `Score: ${score}`;
    updateLivesDisplay();
    fetchWords();
}

document.getElementById('submit-btn').addEventListener('click', checkAnswer);
document.getElementById('answer-input').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        checkAnswer();
    }
});
document.getElementById('reset-btn').addEventListener('click', resetGame);

window.onload = () => {
    fetchWords();
};
