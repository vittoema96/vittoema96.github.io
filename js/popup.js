const popup = document.getElementById('myPopup');
const overlay = document.getElementById('overlay');
const closeButton = document.querySelector('.close-button');
const confirmButton = document.getElementById('confirmButton');
const cancelButton = document.getElementById('cancelButton');

function openMyPopup() {
    popup.style.display = 'block';
    overlay.style.display = 'block';
}

function closeMyPopup() {
    popup.style.display = 'none';
    overlay.style.display = 'none';
}

closeButton.addEventListener('click', closeMyPopup);
overlay.addEventListener('click', closeMyPopup); // Close when clicking outside

// Optional: Handle confirm and cancel actions
if (confirmButton) {
    confirmButton.addEventListener('click', function() {
        alert('Confirmed!');
        closeMyPopup();
        // Add your confirmation logic here
    });
}

if (cancelButton) {
    cancelButton.addEventListener('click', function() {
        alert('Cancelled.');
        closeMyPopup();
        // Add your cancellation logic here
    });
}

// Optional: Close the popup when the Escape key is pressed
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeMyPopup();
    }
});