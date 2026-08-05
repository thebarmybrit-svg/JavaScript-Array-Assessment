// ==========================================================================
// JavaScripts
// ==========================================================================


// GENERATE RANDOM IMAGE
// Global variable to keep track of the current image data (as a Base64 Data URL)
let currentImageDataUrl = '';

// HTML insertion function
function generateImage(imageUrl) {
    const container = document.getElementById('random-image-container');
    if (!container) return; // Guard clause if HTML is missing
    
    container.innerHTML = ''; 
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = "Random photo from Picsum";    
    container.appendChild(img);
}

// Response validator
function checkStatus(response){
    if(response.ok){
        return Promise.resolve(response);
    } else {
        return Promise.reject(new Error(response.statusText));
    }
}

// Data fetcher (returning a Blob)
function fetchData(url){
    return fetch(url)
        .then(checkStatus)
        .then(res => res.blob()) 
        .catch(error => console.log('Looks like there was a problem, ', error));
}

// Helper to convert an image Blob to a persistent Base64 Data URL
function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Fetch a new random image from Picsum
function loadRandomImage() {
    const minId = 0;
    const maxId = 1084;
    const randomId = Math.floor(Math.random() * (maxId - minId + 1)) + minId;
    const targetUrl = `https://picsum.photos/id/${randomId}/400/300`;

    fetchData(targetUrl)
        .then(imageBlob => {
            if (!imageBlob) return; 
            return blobToDataUrl(imageBlob);
        })
        .then(dataUrl => {
            if (!dataUrl) return;
            currentImageDataUrl = dataUrl; // Keep track of the persistent string
            generateImage(currentImageDataUrl);
        });
}

// Helper to append a single entry card or add an image to an existing card in the DOM
function renderEntryToDOM(email, imageDataUrl) {
    const storageContainer = document.getElementById('email-image-storage');
    if (!storageContainer) return;

    // Normalise email to lowercase for data matching
    const normalisedEmail = email.toLowerCase();

    // Check if an entry container for this email already exists in the DOM
    let card = document.querySelector(`.stored-entry[data-email="${CSS.escape(normalisedEmail)}"]`);

    if (!card) {
    // If it doesn't exist, create a new card container
    card = document.createElement('div');
    card.className = 'stored-entry';
    card.setAttribute('data-email', normalisedEmail); 

    // Capitalise only the very first letter of the email header text
    const emailHeader = document.createElement('h3');
    emailHeader.textContent = normalisedEmail.charAt(0).toUpperCase() + normalisedEmail.slice(1);
    card.appendChild(emailHeader);
    
    storageContainer.appendChild(card);
}

    // Creates a new dedicated wrapper for each image
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';

    // Create the image asset
    const imgCopy = document.createElement('img');
    imgCopy.src = imageDataUrl;
    imgCopy.alt = `Saved image for ${normalisedEmail}`;
    
    // Nest the image inside the wrapper, then add the wrapper to the card
    imageContainer.appendChild(imgCopy);
    card.appendChild(imageContainer);
}

// Load existing entries from localStorage on page startup
function loadSavedEntries() {
    const savedData = localStorage.getItem('userSubmissions');
    if (savedData) {
        const entries = JSON.parse(savedData);
        entries.forEach(entry => {
            // Check if it's the new array format
            if (entry.images && Array.isArray(entry.images)) {
                entry.images.forEach(imgUrl => {
                    renderEntryToDOM(entry.email, imgUrl);
                });
            } 
            // Fallback: If it's an old single-image entry, handle it gracefully
            else if (entry.imageDataUrl) {
                renderEntryToDOM(entry.email, entry.imageDataUrl);
            }
        });
    }
}

// Save a new entry or update an existing email with a new image in localStorage
function saveEntryToStorage(email, imageDataUrl) {
    const savedData = localStorage.getItem('userSubmissions');
    const entries = savedData ? JSON.parse(savedData) : [];
    
    // Normalise email to lowercase to check storage case-insensitively
    const normalisedEmail = email.toLowerCase();
    
    // Find if the email already exists in storage
    const existingEntry = entries.find(entry => entry.email.toLowerCase() === normalisedEmail);

    if (existingEntry) {
        // Enforce lowercase uniformity in storage for existing entries
        existingEntry.email = normalisedEmail;

        // If it's an old entry, initialize the images array and clean up old property
        if (!existingEntry.images) {
            existingEntry.images = [];
            if (existingEntry.imageDataUrl) {
                existingEntry.images.push(existingEntry.imageDataUrl);
                delete existingEntry.imageDataUrl; // Optional: clean up the old legacy key
            }
        }
        // If it exists, push the new image to its array
        existingEntry.images.push(imageDataUrl);
    } else {
        // If it's a new email, create an entry with a lowercase email
        entries.push({ email: normalisedEmail, images: [imageDataUrl] });
    }
    
    localStorage.setItem('userSubmissions', JSON.stringify(entries));
}

// Initial initialization on startup
loadSavedEntries();
loadRandomImage();


// EMAIL FORM SUBMISSION
document.getElementById('emailForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const emailInput = document.getElementById('user-email');
    const emailValue = emailInput.value.trim();
    // Email Validation pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Validate the email format
    if (!emailPattern.test(emailValue)) {
        // Show error popup if incorrect
        alert(`The email "${emailValue}" you inputted is not an acceptable email address. 
            \nPlease check the formatting and try again.`);
        emailInput.style.borderColor = 'red';
        emailInput.focus();
        return; 
    }

    emailInput.style.borderColor = '';

    // Render directly to UI
    renderEntryToDOM(emailValue, currentImageDataUrl);

    // Save permanently to localStorage
    saveEntryToStorage(emailValue, currentImageDataUrl);

    // Clean up interface for next entry
    emailInput.value = '';
    loadRandomImage();
});