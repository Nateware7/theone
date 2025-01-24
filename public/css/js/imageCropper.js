// Get references to the DOM elements
const imageUpload = document.getElementById('imageUpload');
const cropperContainer = document.getElementById('cropperContainer');
const imageToCrop = document.getElementById('imageToCrop');
const saveCroppedImageButton = document.getElementById('saveCroppedImage');
const cancelCropButton = document.getElementById('cancelCrop');
const finalImagePreview = document.getElementById('finalImagePreview');
const croppedPreview = document.getElementById('croppedPreview');

let cropper;

// Handle image selection and display the cropper
imageUpload.addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            // Show cropper container and load the image
            cropperContainer.style.display = 'block';
            imageToCrop.src = e.target.result;
            
            // Initialize or reinitialize the Cropper.js instance
            if (cropper) {
                cropper.destroy();
            }
            cropper = new Cropper(imageToCrop, {
                aspectRatio: 3 / 2, // Adjust to your desired aspect ratio
                viewMode: 2, // Ensure the crop box fits the container
                autoCropArea: 1, // Use maximum crop area
                responsive: true,
                zoomable: true,
                scalable: true,
                movable: true,
                background: false, // Optional: remove grid background for a cleaner UI
            });
        };
        reader.readAsDataURL(file);
    }
});

// Save the cropped image
saveCroppedImageButton.addEventListener('click', function () {
    if (cropper) {
        // Get the cropped image data
        const canvas = cropper.getCroppedCanvas();
        const croppedImageData = canvas.toDataURL('image/jpeg'); // Save in JPEG format
        
        // Display the cropped image preview
        croppedPreview.src = croppedImageData;
        finalImagePreview.style.display = 'block';
        
        // Convert Base64 to Blob and create a File object
        const byteString = atob(croppedImageData.split(',')[1]);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        
        for (let i = 0; i < byteString.length; i++) {
            uint8Array[i] = byteString.charCodeAt(i);
        }
        
        const blob = new Blob([uint8Array], { type: 'image/jpeg' });
        const file = new File([blob], 'cropped_image.jpg', { type: 'image/jpeg' });
        
        // Replace the original file input with the cropped image file
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        imageUpload.files = dataTransfer.files;
        
        // Hide the cropper container
        cropperContainer.style.display = 'none';
    }
});

// Cancel cropping
cancelCropButton.addEventListener('click', function () {
    // Reset the cropper and hide the cropper container
    if (cropper) {
        cropper.destroy();
    }
    cropperContainer.style.display = 'none';
    
    // Reset the file input and hide the final preview
    imageUpload.value = '';
    croppedPreview.src = '';
    finalImagePreview.style.display = 'none';
});