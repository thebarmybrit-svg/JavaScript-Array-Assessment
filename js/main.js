// ==========================================================================
// JavaScripts
// ==========================================================================


// GENERATE RANDOM IMAGE
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

// Call the function and run the chain
const minId = 0;
const maxId = 1084;
const randomId = Math.floor(Math.random() * (maxId - minId + 1)) + minId;
const targetUrl = `https://picsum.photos/id/${randomId}/400/300`;

fetchData(targetUrl)
    .then(imageBlob => {
        if (!imageBlob) return; 
        
        const randomImageUrl = URL.createObjectURL(imageBlob);
        generateImage(randomImageUrl);
});

// EMAIL FORM
document.getElementById('emailForm').addEventListener('submit', function(event) {
  // stops the form from changing pages or reloading
  event.preventDefault();

  const emailInput = document.getElementById('user-email');
  const emailValue = emailInput.value.trim();
  // Email Validation pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validate the email format
  if (!emailPattern.test(emailValue)) {
    // Show error popup if incorrect
    alert(`The email "${emailValue}" you inputted is not an acceptable email address. 
        Please check the formatting and try again.`);
    emailInput.style.borderColor = 'red';
    emailInput.focus();
    return; // Exit early
  }
});

// STORING IMAGES
