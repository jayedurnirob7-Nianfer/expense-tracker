/**
 * Compresses an image file (e.g. from camera or file picker) 
 * to a lightweight web-friendly Base64 Data URL.
 * 
 * @param {File|Blob} file - The raw image file from file input or camera
 * @param {number} maxWidth - Maximum width in pixels (default: 1200)
 * @param {number} maxHeight - Maximum height in pixels (default: 1200)
 * @param {number} quality - JPEG compression quality 0-1 (default: 0.82)
 * @returns {Promise<string>} Compressed Base64 data URL
 */
export const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.82) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided for compression'));
    }

    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image'));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let { width, height } = img;

        // Calculate proportional dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(event.target.result); // Fallback to raw if canvas context unavailable
        }

        // Fill background with white for transparency safety
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized JPEG Base64
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };

      img.onerror = () => reject(new Error('Failed to load image for compression'));
    };

    reader.onerror = () => reject(new Error('Failed reading image file'));
  });
};

const DEFAULT_IMGBB_KEY = '11de2af279ceced95c30f6c8c459de7e';

/**
 * Optimizes image locally and uploads directly to ImgBB CDN,
 * returning a permanent, fast HTTPS image URL.
 * 
 * @param {File|Blob|string} fileOrBase64 - The image file or base64 data
 * @returns {Promise<string>} Permanent CDN image URL (https://i.ibb.co/...)
 */
export const uploadToImgBB = async (fileOrBase64) => {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY || DEFAULT_IMGBB_KEY;

  // 1. Locally compress image to max 1200px so upload takes < 1 second
  let base64String = '';
  if (typeof fileOrBase64 === 'string') {
    base64String = fileOrBase64;
  } else {
    base64String = await compressImage(fileOrBase64, 1200, 1200, 0.82);
  }

  // Extract clean base64 data without data:image/jpeg;base64, prefix
  const cleanBase64 = base64String.replace(/^data:image\/[a-z]+;base64,/, '');

  const formData = new FormData();
  formData.append('image', cleanBase64);

  // 2. Upload to ImgBB API
  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ImgBB upload error: ${errorText || response.statusText}`);
  }

  const json = await response.json();
  if (json.success && json.data?.url) {
    return json.data.display_url || json.data.url;
  } else {
    throw new Error(json.error?.message || 'Failed to upload photo to ImgBB');
  }
};
