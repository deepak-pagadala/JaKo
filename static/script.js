let score = 0;
let lives = 5;
let currentWord = "";
let wordText;
let fallingWord;
let correctWords = [];
let incorrectWords = [];
let totalWords = 0;
let wordSpeed = 1.0; // Initial falling speed
let repeatWordCounter = 0; // Counter to track when to reintroduce incorrect words

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
    if (fallingWord) {
        fallingWord.y += wordSpeed; // Speed of the falling word
        if (fallingWord.y > 400) { // Height of the game area
            console.log('Word fell out of the game area');
            lives--;
            document.getElementById('lives').textContent = lives;
            if (lives <= 0) {
                alert("Game Over!");
                resetGame();
            } else {
                fetchWord();
            }
        }
    }
}

function fetchAllWords() {
    console.log('Fetching all words...');
    fetch(`/get_all_words/${language}/${category}`)
        .then(response => response.json())
        .then(data => {
            const words = Object.keys(data).length; // Number of words fetched
            console.log('Total words in this category:', words); // Log total words to the console
            totalWords = words; // Assign to totalWords variable
            fetchWord();
        })
        .catch(error => console.error('Error fetching all words:', error));
}

function fetchWord() {
    console.log('Fetching a word...');
    if (repeatWordCounter >= 2 && incorrectWords.length > 0) {
        // Reintroduce an incorrect word
        console.log('Reintroducing an incorrect word');
        const wordData = incorrectWords.shift();
        currentWord = wordData.english;
        if (fallingWord) {
            fallingWord.destroy();
        }
        fallingWord = game.scene.scenes[0].add.text(300, 0, wordData.japanese, { font: '48px Arial', fill: '#000' }).setOrigin(0.5);
        displayOptions(wordData.options, wordData.english);
        speakWord(wordData.japanese);
        showRepeatLabel(true);
        repeatWordCounter = 0;
    } else {
        fetch(`/get_word/${language}/${category}`)
            .then(response => response.json())
            .then(data => {
                console.log('Fetched word data:', data);
                if (data.japanese && data.english) {
                    if (correctWords.includes(data.english)) {
                        fetchWord(); // Fetch another word if this one has been answered correctly before
                    } else {
                        currentWord = data.english;
                        if (fallingWord) {
                            fallingWord.destroy();
                        }
                        fallingWord = game.scene.scenes[0].add.text(300, 0, data.japanese, { font: '48px Arial', fill: '#000' }).setOrigin(0.5);
                        displayOptions(data.options, data.english);
                        speakWord(data.japanese);
                        showRepeatLabel(false);
                        console.log('Fetched word:', data.japanese);
                    }
                }
            })
            .catch(error => console.error('Error fetching word:', error));
        repeatWordCounter++;
    }
}

function displayOptions(options, correctAnswer) {
    console.log('Displaying options:', options);
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = option;
        btn.onclick = () => checkAnswer(option, correctAnswer, btn);
        optionsContainer.appendChild(btn);
    });
}

function checkAnswer(selected, correct, btn) {
    console.log('Checking answer:', selected, correct);
    if (selected === correct) {
        btn.classList.add('correct');
        score++;
        document.getElementById('score').textContent = score;
        correctWords.push(currentWord);
        wordSpeed *= 1.1; // Increase speed by 10%
        if (correctWords.length === totalWords) {
            showCongratsMessage();
        } else {
            setTimeout(fetchWord, 1000); // Fetch next word after a short delay
        }
    } else {
        btn.classList.add('incorrect');
        lives--;
        document.getElementById('lives').textContent = lives;
        if (lives <= 0) {
            alert("Game Over!");
            resetGame();
        } else {
            incorrectWords.push({ japanese: fallingWord.text, english: currentWord, options: getCurrentOptions() });
            setTimeout(fetchWord, 1000); // Fetch next word after a short delay
        }
    }
}

function getCurrentOptions() {
    const buttons = document.querySelectorAll('.option-btn');
    return Array.from(buttons).map(btn => btn.textContent);
}

function speakWord(word) {
    console.log('Speaking word:', word);
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
    console.log('Showing congratulations message');
    if (fallingWord) {
        fallingWord.destroy();
    }
    game.scene.scenes[0].add.text(300, 200, `Congrats! You have learned ${category.replace('%20', ' ')}!`, { font: '32px Arial', fill: '#000' }).setOrigin(0.5);
    setTimeout(() => {
        resetGame();
        window.location.href = `/category/${language}`;
    }, 3000); // Redirect to category selection after 3 seconds
}

function resetGame() {
    console.log('Resetting game');
    score = 0;
    lives = 5;
    wordSpeed = 1.0; // Reset speed
    correctWords = [];
    incorrectWords = [];
    repeatWordCounter = 0;
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    fetchWord();
}

document.getElementById('reset-btn').addEventListener('click', resetGame);

window.onload = () => {
    console.log('Window loaded, starting game...');
    fetchWord();
};
