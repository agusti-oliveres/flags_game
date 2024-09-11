let currentFlag = '';
let correctAnswer = '';
let score = 0;
let totalGuesses = 0;

const flagContainer = document.getElementById('flag-container');
const flagImage = document.getElementById('flag');
const optionsContainer = document.getElementById('options-container');
const resultDisplay = document.getElementById('result');
const scoreDisplay = document.getElementById('score');
const modeToggle = document.getElementById('mode-toggle');
const numOptionsSelect = document.getElementById('num-options');
const continentSelect = document.getElementById('continent');
const languageInput = document.getElementById('language');
const populationSelect = document.getElementById('population');

function getFlag() {
    const numOptions = numOptionsSelect.value;
    const continent = continentSelect.value;
    const language = languageInput.value;
    const population = populationSelect.value;

    fetch(`/get_flag?num_options=${numOptions}&continent=${continent}&language=${language}&population=${population}`)
        .then(response => response.json())
        .then(data => {
            currentFlag = data.code;
            correctAnswer = data.correct_answer;
            const isColorMode = modeToggle.checked;

            if (isColorMode) {
                flagContainer.innerHTML = `<div id="color-box" style="background-color: ${data.avg_color};"></div>`;
            } else {
                flagImage.src = `https://flagcdn.com/w320/${data.code}.png`;
            }

            optionsContainer.innerHTML = '';
            data.options.forEach(option => {
                const button = document.createElement('button');
                button.textContent = option;
                button.classList.add('option-button');
                button.addEventListener('click', () => checkGuess(option));
                optionsContainer.appendChild(button);
            });
        });
}

function checkGuess(guess) {
    totalGuesses++;
    const isCorrect = guess === correctAnswer;
    if (isCorrect) {
        score++;
    }

    resultDisplay.textContent = isCorrect ? 'Correct!' : `Incorrect. The correct answer was ${correctAnswer}.`;
    resultDisplay.className = isCorrect ? 'correct' : 'incorrect';

    document.querySelectorAll('.option-button').forEach(button => {
        button.disabled = true;
    });

    if (modeToggle.checked) {
        setTimeout(() => {
            flagContainer.innerHTML = `<img id="flag" src="https://flagcdn.com/w320/${currentFlag}.png" alt="Country Flag">`;
        }, 1000);
    }

    setTimeout(() => {
        getFlag();
        resultDisplay.textContent = '';
        resultDisplay.className = '';
    }, 3000);

    updateScore();
}

function updateScore() {
    document.getElementById('correct-guesses').textContent = score;
    document.getElementById('total-guesses').textContent = totalGuesses;
}

modeToggle.addEventListener('change', getFlag);
numOptionsSelect.addEventListener('change', getFlag);
continentSelect.