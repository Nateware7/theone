document.addEventListener('DOMContentLoaded', function () {
    // Get input elements
    const usernameInput = document.getElementById('username');
    const priceInput = document.getElementById('user-price');
    const descriptionInput = document.getElementById('user-description');

    // Get preview elements
    const previewUsername = document.getElementById('preview-username');
    const previewPrice = document.getElementById('preview-price');
    const previewDescription = document.getElementById('preview-description');

    // Update preview on input change
    usernameInput.addEventListener('input', function () {
        previewUsername.textContent = this.value || 'Preview Username';
    });

    priceInput.addEventListener('input', function () {
        previewPrice.textContent = `$${this.value || '0'}`;
    });

    descriptionInput.addEventListener('input', function () {
        previewDescription.textContent = this.value || 'Description will appear here';
    });
});

function updatePlatformStyle(input) {
// Update the platform selector styles
document.querySelectorAll('.platform-selector').forEach(selector => {
selector.classList.remove('selected');
});
const selectedPlatformElement = input.nextElementSibling;
selectedPlatformElement.classList.add('selected');

// Update the preview image based on the selected platform
const selectedPlatform = input.value;
const previewImage = document.querySelector("#user-preview img");
switch (selectedPlatform) {
case "instagram":
    previewImage.src = "css/imgs/instagram.png";
    previewImage.alt = "Instagram Preview";
    break;
case "x":
    previewImage.src = "css/imgs/x.png";
    previewImage.alt = "X Preview";
    break;
case "discord":
    previewImage.src = "css/imgs/discord.png";
    previewImage.alt = "Discord Preview";
    break;
default:
    previewImage.src = "#";
    previewImage.alt = "No Preview";
}
}

function toggleForm(radio) {
    const userForm = document.getElementById('user-form');
    const programForm = document.getElementById('program-form');
    const userPreview = document.getElementById('user-preview');
    
    document.querySelectorAll('.form-selector').forEach(selector => {
        selector.classList.remove('selected');
    });
    radio.nextElementSibling.classList.add('selected');

    if (radio.value === 'user') {
        userForm.classList.remove('hidden');
        programForm.classList.add('hidden');
        userPreview.classList.remove('hidden');
    } else {
        userForm.classList.add('hidden');
        programForm.classList.remove('hidden');
        userPreview.classList.add('hidden');
    }
}