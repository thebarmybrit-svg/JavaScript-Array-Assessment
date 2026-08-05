// ==========================================================================
// JavaScripts
// ==========================================================================


// GENERATE RANDOM IMAGE
// Global variable to keep track of the current image data (as a Base64 Data URL)
let currentImageDataUrl = '';

// HTML insertion function
function generateImage(imageUrl) {
    const container = document.getElementById('image-container');
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

// Helper to append a single entry card to the DOM
function renderEntryToDOM(email, imageDataUrl) {
    const storageContainer = document.getElementById('email-image-storage');
    if (!storageContainer) return;

    const card = document.createElement('div');
    card.className = 'stored-entry';

    const emailHeader = document.createElement('h3');
    emailHeader.textContent = email;

    const imgCopy = document.createElement('img');
    imgCopy.src = imageDataUrl;
    imgCopy.alt = `Saved image for ${email}`;

    card.appendChild(emailHeader);
    card.appendChild(imgCopy);
    storageContainer.appendChild(card);
}

// Load existing entries from localStorage on page startup
function loadSavedEntries() {
    const savedData = localStorage.getItem('userSubmissions');
    if (savedData) {
        const entries = JSON.parse(savedData);
        entries.forEach(entry => {
            renderEntryToDOM(entry.email, entry.imageDataUrl);
        });
    }
}

// Save a new entry to the array in localStorage
function saveEntryToStorage(email, imageDataUrl) {
    const savedData = localStorage.getItem('userSubmissions');
    const entries = savedData ? JSON.parse(savedData) : [];
    
    entries.push({ email, imageDataUrl });
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
