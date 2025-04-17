document.addEventListener('DOMContentLoaded', () => {
    // Ensure countries data is loaded
    if (typeof countries === 'undefined' || countries.length === 0) {
        console.error("Countries data is not loaded or is empty!");
        alert("Error loading country data. The game cannot start.");
        return; // Stop execution if countries are missing
    }

    let correctAnswer = '';
    let correctFlagCode = '';
    let correctAvgColor = '#FFFFFF'; // Default/fallback average color
    let correctGuesses = 0;
    let totalGuesses = 0;
    let isColorMode = false;
    let currentFlagImage = null; // To store the Image object for color calculation

    const flagContainer = document.getElementById('flag-container');
    const optionsContainer = document.getElementById('options-container');
    const resultElement = document.getElementById('result');
    const scoreCorrectElement = document.getElementById('correct-guesses');
    const scoreTotalElement = document.getElementById('total-guesses');
    const gameModeToggle = document.getElementById('game-mode-toggle');
    const customColorsContainer = document.getElementById('custom-colors-container');
    const addColorButton = document.getElementById('add-color-button');
    const colorTableBody = document.querySelector('#color-table tbody');
    const averageColorBox = document.getElementById('average-color-box');

    // --- Average Color Calculation ---
    function getAverageColor(imgElement) {
        return new Promise((resolve, reject) => {
            // Use the already loaded image if available
            const img = imgElement || currentFlagImage;

            if (!img || !img.complete || img.naturalHeight === 0) {
                 console.error("Image not loaded or invalid for color calculation.");
                 // Attempt to reload if imgElement is provided and differs from currentFlagImage
                 if (imgElement && imgElement !== currentFlagImage) {
                     imgElement.onload = () => resolve(calculateColor(imgElement));
                     imgElement.onerror = () => {
                         console.error("Image failed to load on retry.");
                         resolve("#FFFFFF"); // Fallback on error
                     };
                     // If src is missing, maybe set it? Depends on how imgElement is passed.
                 } else {
                    resolve("#FFFFFF"); // Fallback color
                 }
                 return;
            }
             resolve(calculateColor(img));
        });
    }

    function calculateColor(img) {
        const canvas = document.createElement('canvas');
        // Reduce canvas size for performance, maintain aspect ratio
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        const canvasWidth = Math.min(img.naturalWidth, 100); // Max width 100px
        const canvasHeight = canvasWidth / aspectRatio;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');

        try {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            let r = 0, g = 0, b = 0;

            // Iterate over pixels (stride by 4 for R,G,B,A)
            for (let i = 0; i < data.length; i += 4) {
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
                // We ignore alpha (data[i+3]) for average color calculation
            }

            const pixelCount = data.length / 4;
            if (pixelCount === 0) return "#FFFFFF"; // Avoid division by zero

            r = Math.round(r / pixelCount);
            g = Math.round(g / pixelCount);
            b = Math.round(b / pixelCount);

            return rgbToHex(r, g, b);
        } catch (e) {
            console.error("Error calculating average color:", e);
            // Handle potential CORS issues if flags are from another domain,
            // or other canvas errors.
            return "#CCCCCC"; // Return a grey color on error
        }
    }


    // --- Game Logic ---
    async function getNewFlag() {
        if (countries.length < 6) {
            console.error("Not enough countries loaded to provide 6 options.");
            flagContainer.innerHTML = "<p>Error: Not enough country data.</p>";
            optionsContainer.innerHTML = "";
             resultElement.textContent = '';
            return;
        }

        // Select correct country
        const correctCountryIndex = Math.floor(Math.random() * countries.length);
        const correctCountry = countries[correctCountryIndex];
        correctAnswer = correctCountry.name;
        correctFlagCode = correctCountry.code;

        // Select options
        const options = [correctCountry.name];
        const usedIndices = new Set([correctCountryIndex]); // Track used indices

        while (options.length < 6) {
            const optionIndex = Math.floor(Math.random() * countries.length);
            if (!usedIndices.has(optionIndex)) {
                options.push(countries[optionIndex].name);
                usedIndices.add(optionIndex);
            }
        }
        randomShuffle(options); // Shuffle options

        // Prepare UI
        resultElement.textContent = '';
        resultElement.className = ''; // Clear result style
        displayOptions(options);

        const flagUrl = `flags/${correctFlagCode}.png`;

        // Create and load the image element *once*
        const img = new Image();
        img.crossOrigin = "Anonymous"; // Add this if flags might be hosted elsewhere or for canvas security
        img.onload = async () => {
            currentFlagImage = img; // Store the loaded image
            try {
                correctAvgColor = await getAverageColor(img); // Calculate average color after loading
            } catch (error) {
                console.error("Failed to calculate average color:", error);
                correctAvgColor = "#FFFFFF"; // Fallback on error
            }


            // Update UI based on game mode
            if (isColorMode) {
                flagContainer.innerHTML = `
                    <div id="color-box" style="background-color: ${correctAvgColor};"></div>
                `;
            } else {
                 flagContainer.innerHTML = ''; // Clear previous content
                 img.id = 'flag'; // Assign ID for styling
                 flagContainer.appendChild(img); // Append the loaded image
            }
        };
        img.onerror = () => {
            console.error(`Failed to load flag image: ${flagUrl}`);
            flagContainer.innerHTML = `<p>Error loading flag for ${correctAnswer}</p>`;
            // Decide how to handle this - maybe try another flag?
             optionsContainer.innerHTML = ''; // Clear options if flag fails
             correctAvgColor = "#FFFFFF"; // Fallback color
              if (isColorMode) { // Still show color box in color mode, maybe gray
                 flagContainer.innerHTML = `
                    <div id="color-box" style="background-color: #CCCCCC;"></div>`;
             }
             setTimeout(getNewFlag, 2000); // Try fetching a new flag after a delay
        };
        img.src = flagUrl; // Start loading the image
    }

    function displayOptions(options) {
        optionsContainer.innerHTML = ''; // Clear previous options
        options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.classList.add('option-button');
            button.addEventListener('click', () => checkGuess(option));
            optionsContainer.appendChild(button);
        });
    }

    function checkGuess(guess) {
        totalGuesses++;
        disableOptions();

        if (guess === correctAnswer) {
            correctGuesses++;
            resultElement.textContent = 'Correct! Well done!';
            resultElement.className = 'correct';
        } else {
            resultElement.textContent = `Wrong. The correct answer was ${correctAnswer}.`;
            resultElement.className = 'incorrect';
        }

        updateScore();

        // Reveal logic (show flag in color mode)
        if (isColorMode && currentFlagImage && currentFlagImage.complete) {
            const flagReveal = currentFlagImage.cloneNode(); // Clone the loaded image
             flagReveal.id = 'flag'; // Ensure it has the ID for styling
             flagReveal.style.height = '133px'; // Match color box height
             flagReveal.style.width = 'auto'; // Maintain aspect ratio


            // Show color box and flag side-by-side after a short delay
             setTimeout(() => {
                 flagContainer.innerHTML = `
                     <div style="display: flex; justify-content: center; align-items: center; gap: 10px;">
                         <div id="color-box" style="background-color: ${correctAvgColor}; width: 200px; height: 133px;"></div>
                     </div>
                 `;
                  // Find the div again and append the image
                 const containerDiv = flagContainer.querySelector('div');
                 if(containerDiv) containerDiv.appendChild(flagReveal);

             }, 500); // Delay before showing flag
        } else if (!isColorMode && currentFlagImage) {
             // If in flag mode, just ensure the correct flag is displayed
             flagContainer.innerHTML = '';
             flagContainer.appendChild(currentFlagImage);
        }

        // Schedule next flag load
        setTimeout(getNewFlag, 2500); // Load next flag after showing result
    }

    function updateScore() {
        scoreCorrectElement.textContent = correctGuesses;
        scoreTotalElement.textContent = totalGuesses;
    }

    function disableOptions() {
        const buttons = optionsContainer.querySelectorAll('.option-button');
        buttons.forEach(button => button.disabled = true);
    }

    // --- Custom Color Input Logic ---
    function addColorRow() {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="color" class="color-input" value="#ffffff"></td>
            <td><input type="number" class="percentage-input" value="1" min="1"></td>
            <td><button type="button" class="remove-color-button button-style">Remove</button></td>
        `;
        colorTableBody.appendChild(row);

        // Attach event listeners
        row.querySelector('.remove-color-button').addEventListener('click', () => {
            row.remove();
            calculateAndDisplayAverageColor();
        });
        row.querySelector('.color-input').addEventListener('input', calculateAndDisplayAverageColor);
        row.querySelector('.percentage-input').addEventListener('input', calculateAndDisplayAverageColor);

        // Initial calculation needed if adding the first row or if default values should apply
        calculateAndDisplayAverageColor();
    }

    function calculateAndDisplayAverageColor() {
        const colorInputs = colorTableBody.querySelectorAll('.color-input');
        const percentageInputs = colorTableBody.querySelectorAll('.percentage-input');

        let totalWeight = 0;
        let totalRed = 0, totalGreen = 0, totalBlue = 0;

        colorInputs.forEach((input, index) => {
            const colorHex = input.value;
            const weight = parseFloat(percentageInputs[index].value) || 0;

            if (weight > 0) {
                 totalWeight += weight;
                 const [r, g, b] = hexToRgb(colorHex);
                 totalRed += r * weight;
                 totalGreen += g * weight;
                 totalBlue += b * weight;
            }
        });

        let avgColorHex = "#FFFFFF"; // Default to white if no valid inputs
        if (totalWeight > 0) {
            const avgRed = Math.round(totalRed / totalWeight);
            const avgGreen = Math.round(totalGreen / totalWeight);
            const avgBlue = Math.round(totalBlue / totalWeight);
            avgColorHex = rgbToHex(avgRed, avgGreen, avgBlue);
        }

        averageColorBox.style.backgroundColor = avgColorHex;
    }


    // --- Utility Functions ---
    function randomShuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
    }

    function hexToRgb(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return [r, g, b];
    }

    function rgbToHex(r, g, b) {
        // Clamp values to ensure they are within 0-255 range
        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));
        // Convert to hex
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
    }


    // --- Event Listeners ---
    gameModeToggle.addEventListener('change', function() {
        isColorMode = this.checked;
        customColorsContainer.style.display = isColorMode ? 'block' : 'none';
        getNewFlag(); // Fetch new flag/color when mode changes
    });

    addColorButton.addEventListener('click', addColorRow);


    // --- Initialization ---
    updateScore();
    addColorRow(); // Add one color input row by default
    getNewFlag();  // Start the game
});