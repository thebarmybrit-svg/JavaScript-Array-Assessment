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
    
    // Create a temporary image object in memory
    const tempImg = new Image();
    tempImg.alt = "Random photo from Picsum";
    
    // Set up the onload listener BEFORE setting the src
    tempImg.onload = function() {
        container.innerHTML = ''; // Safely clear now that the image is ready
        container.appendChild(tempImg); // Append the preloaded element
    };
    
    // Trigger the network request
    tempImg.src = imageUrl;
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
    const targetUrl = `https://picsum.photos/750/500`;

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

// Generates new random image
const newRandomButton = document.querySelector('.newRandom');
if (newRandomButton) {
    newRandomButton.addEventListener('click', loadRandomImage);
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
    
     // Create the delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-delete-image icon-cross';
    deleteBtn.title = 'Delete this image';

    // Nest the image and delete button inside the wrapper, then add the wrapper to the card
    imageContainer.appendChild(imgCopy);
    imageContainer.appendChild(deleteBtn); // Add the button here
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
                delete existingEntry.imageDataUrl; // Clean up the old legacy key
            }
        }
        
        // CRITICAL CHECK: Do not push if it already exists
        if (existingEntry.images.includes(imageDataUrl)) {
            return; 
        }
        
        // If it exists and is unique, push the new image to its array
        existingEntry.images.push(imageDataUrl);
    } else {
        // If it's a new email, create an entry with a lowercase email
        entries.push({ email: normalisedEmail, images: [imageDataUrl] });
    }
    
    localStorage.setItem('userSubmissions', JSON.stringify(entries));
}

// Remove an individual image from a specific email entry in localStorage
function deleteEntryFromStorage(email, imageDataUrl) {
    const savedData = localStorage.getItem('userSubmissions');
    if (!savedData) return;

    let entries = JSON.parse(savedData);
    const normalisedEmail = email.toLowerCase();

    // Find the record matching this email
    const existingEntry = entries.find(entry => entry.email.toLowerCase() === normalisedEmail);

    if (existingEntry && existingEntry.images) {
        // Filter out the deleted image string
        existingEntry.images = existingEntry.images.filter(img => img !== imageDataUrl);

        // If the user profile has zero images remaining, remove the whole user account
        if (existingEntry.images.length === 0) {
            entries = entries.filter(entry => entry.email.toLowerCase() !== normalisedEmail);
        }
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
        alert(`The email "${emailValue}" you inputted is not an acceptable email address. \n\nPlease check the formatting and try again.`);
        emailInput.style.borderColor = 'red';
        emailInput.focus();
        return; 
    }

    emailInput.style.borderColor = '';

    // Check if this exact email and image pairing already exists in storage
    const savedData = localStorage.getItem('userSubmissions');
    if (savedData) {
        const entries = JSON.parse(savedData);
        const normalisedEmail = emailValue.toLowerCase();
        const existingEntry = entries.find(entry => entry.email.toLowerCase() === normalisedEmail);

        if (existingEntry) {
            // Check old flat property fallback or new array format
            const hasDuplicateImage = (existingEntry.images && existingEntry.images.includes(currentImageDataUrl)) || (existingEntry.imageDataUrl === currentImageDataUrl);  
            if (hasDuplicateImage) {
                alert(`The image you are trying to add has already been saved to the account: ${emailValue}. Duplicates are not allowed.`);
                return; // Stop execution: does not render to DOM, does not save
            }
        }
    }

    // Render directly to UI
    renderEntryToDOM(emailValue, currentImageDataUrl);

    // Save permanently to localStorage
    saveEntryToStorage(emailValue, currentImageDataUrl);

    // Clean up interface for next entry - removed
    // emailInput.value = '';
    // loadRandomImage();
});


// LIGHTBOX OVERLAY
const lightbox = document.getElementById('image-lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeBtn = document.getElementById('lightbox-close');

// USE EVENT DELEGATION: Listen to the parent container instead of individual images
const storageContainer = document.getElementById('email-image-storage');
if (storageContainer) {
    storageContainer.addEventListener('click', (e) => {
        // Only run the lightbox logic if the clicked element is an image inside an .image-container
        if (e.target.tagName === 'IMG' && e.target.closest('.image-container')) {
            // Set the modal image source to match the clicked image source
            lightboxImg.src = e.target.src;
            lightboxImg.alt = e.target.alt;
            // Show the lightbox
            lightbox.classList.add('is-active');
            // Prevent background scrolling while open
            document.body.style.overflow = 'hidden'; 
        }
    });
}

// DELETE IMAGE
let imageContainerToDelete = null;
let cardToDelete = null;

const deleteModal = document.getElementById('delete-confirm');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

// Helper to toggle modal visibility
function toggleDeleteModal(isOpen) {
    if (isOpen) {
        deleteModal.classList.add('is-active');
        document.body.style.overflow = 'hidden'; // Stop background scroll
    } else {
        deleteModal.classList.remove('is-active');
        document.body.style.overflow = '';
        // Clear references
        imageContainerToDelete = null;
        cardToDelete = null;
    }
}

// DELETE BUTTON DELEGATION: Listen to clicks inside the permanent parent container
if (storageContainer) {
    storageContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-delete-image')) {
            const container = e.target.closest('.image-container');
            const card = e.target.closest('.stored-entry');
            
            if (!container || !card) return;

            // Store current target elements in global tracker variable
            imageContainerToDelete = container;
            cardToDelete = card;

            // Trigger visual modal pop up
            toggleDeleteModal(true);
        }
    });
}

// CONFIRM DELETION ACTION
confirmDeleteBtn.addEventListener('click', () => {
    if (imageContainerToDelete && cardToDelete) {
        const targetImg = imageContainerToDelete.querySelector('img');
        const email = cardToDelete.getAttribute('data-email');
        
        if (targetImg && email) {
            // 1. Remove from localStorage arrays
            deleteEntryFromStorage(email, targetImg.src);

            // 2. Remove specific HTML nodes from DOM
            imageContainerToDelete.remove();

            // 3. Sweep away parent container if completely empty
            if (cardToDelete.querySelectorAll('.image-container').length === 0) {
                cardToDelete.remove();
            }
        }
    }
    toggleDeleteModal(false);
});

// CANCEL DELETION ACTIONS
cancelDeleteBtn.addEventListener('click', () => toggleDeleteModal(false));

// Close modal when clicking dark overlay frame background
deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
        toggleDeleteModal(false);
    }
});

// Close modal when hitting the Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && deleteModal.classList.contains('is-active')) {
        toggleDeleteModal(false);
    }
});
// Helper function to close the lightbox
const closeLightbox = () => {
    lightbox.classList.remove('is-active');
    lightboxImg.src = ''; // Clear source
    document.body.style.overflow = ''; // Restore scrolling
};

// Close when clicking the "X" button
closeBtn.addEventListener('click', closeLightbox);

// Close when clicking outside the image (on the dimmed background overlay)
lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
        closeLightbox();
    }
});

// Close when hitting the Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('is-active')) {
        closeLightbox();
    }
});