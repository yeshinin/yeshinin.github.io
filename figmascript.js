const comfortThings = [
    "A warm cup of tea on a rainy day",
    "Soft blankets fresh from the dryer",
    "The smell of freshly baked cookies",
    "Rewatching your favorite comfort show",
    "A long, warm shower",
    "Listening to rain sounds",
    "Lighting a scented candle",
    "Writing in a journal",
    "Taking a walk in nature",
    "Calling a friend just to chat",
    "Reading a book you've read before",
    "Wearing your coziest pajamas",
    "Making your favorite comfort food",
    "Listening to nostalgic music",
    "Looking at old photos",
    "Doing a face mask or self-care routine",
    "Cuddling with a pet",
    "Watching the sunset",
    "Organizing your space",
    "Taking a nap in the afternoon"
];

const pouchButton = document.getElementById('pouch-button');
const chit = document.getElementById('chit');
const chitText = document.getElementById('chit-text');

function drawChit() {
    // Add shake animation to the pouch
    pouchButton.classList.add('shake');
    
    setTimeout(() => {
        // Get random comfort thing
        const randomPhrase = comfortThings[Math.floor(Math.random() * comfortThings.length)];
        
        // Update chit text
        chitText.textContent = randomPhrase;
        
        // Show the chit
        chit.classList.remove('hidden');
        chit.classList.add('visible');
        
        // Remove shake animation
        pouchButton.classList.remove('shake');
    }, 400);
}

function closeChit() {
    chit.classList.remove('visible');
    setTimeout(() => {
        chit.classList.add('hidden');
    }, 600);
}

// Add event listeners
pouchButton.addEventListener('click', drawChit);
chit.addEventListener('click', closeChit);
