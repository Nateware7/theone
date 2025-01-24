    // Drag and drop functionality
    const dropZone = document.querySelector('.border-dashed');
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-orange-500');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-orange-500');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-orange-500');
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            imageUpload.files = dataTransfer.files;
            imageUpload.dispatchEvent(new Event('change'));
        }
    });