import React, { useState } from 'react';
import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';

const BackgroundRemover = () => {
  const [image, setImage] = useState(null);
  const [bgRemovedImage, setBgRemovedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageSize] = useState('preview'); // 'preview' or 'auto'
  const [error, setError] = useState(null);

  const API_KEY = process.env.REACT_APP_REMOVE_BG_API_KEY;
  const API_URL = `https://api.remove.bg/v1.0/removebg`;

  const handleImageUpload = async (event) => {
    if (Capacitor.isNativePlatform()) {
      try {
        const photo = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl, // Base64
        });
        if (photo.dataUrl) {
          setError(null);
          setBgRemovedImage(null);
          setImage(photo.dataUrl);
        }
      } catch (e) {
        console.error("Camera error:", e);
        setError("Failed to get image from device.");
      }
    } else {
      // Existing web logic
      const file = event.target.files[0];
      if (file) {
        setError(null);
        setBgRemovedImage(null);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImage(reader.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeBackground = async () => {
    if (!image) return;
    
    setLoading(true);
    setError(null);
    setBgRemovedImage(null);

    try {
      const formData = new FormData();
      // Convert base64 to a Blob
      const byteCharacters = atob(image.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' }); // Adjust type if necessary

      // The API expects the image file as a Blob
      formData.append('image_file', blob, 'image.png');
      formData.append('size', imageSize); // Default to preview or current size

      const response = await axios.post(API_URL, formData, {
        headers: {
          'X-Api-Key': API_KEY,
        },
        responseType: 'arraybuffer', // Expect binary data
      });

      // The API returns the image binary data directly when image_file is used.
      // Convert ArrayBuffer to base64 string for display.
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.startsWith('image/')) {
        // If the API returns a non-image response (e.g., an error as JSON), handle it.
        // Convert ArrayBuffer back to text and attempt to parse as JSON for better error logging.
        const errorData = new TextDecoder().decode(response.data);
        let errorMsg = 'API returned an invalid image response.';
        try {
            const jsonError = JSON.parse(errorData);
            if (jsonError.errors) {
                 errorMsg = `API Error: ${jsonError.errors.map(e => e.title).join(', ')}`;
            } else {
                 errorMsg = `API Error: ${errorData}`;
            }
        } catch (e) {
            // Not a JSON error, stick to generic message
        }
        throw new Error(errorMsg);
      }
      
      const base64Image = btoa(
        new Uint8Array(response.data).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );
      const newBgRemovedImage = `data:${contentType};base64,${base64Image}`;
      setBgRemovedImage(newBgRemovedImage);
    } catch (err) {
      console.error("Background removal error:", err);
      setError('Failed to remove background. Check console for details or if API key is valid.');
      if (err.response && err.response.data && err.response.data.errors) {
         setError(`API Error: ${err.response.data.errors.map(e => e.title).join(', ')} - Details: ${JSON.stringify(err.response.data)}`);
      } else if (err.response) {
         setError(`API Error: Status ${err.response.status} - ${err.response.statusText}. Check if your API key is correct.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async (size, imageToDownload = bgRemovedImage) => { // Modified to accept size and optional image data
    if (!imageToDownload) return;

    if (Capacitor.isNativePlatform()) {
      try {
        const fileName = `removed-bg-${size}-${new Date().getTime()}.png`;
        await Filesystem.writeFile({
          path: fileName,
          data: imageToDownload,
          directory: Directory.Downloads,
          recursive: true,
        });
        alert('Image saved to Downloads folder!');
      } catch (e) {
        console.error("Filesystem write error:", e);
        setError("Failed to save image to device.");
      }
    } else {
      // Existing web logic
      const link = document.createElement('a');
      link.href = imageToDownload;
      link.download = `removed-bg-${size}.png`; // Use passed size for filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div>
      <div className="controls top-controls">
        <label htmlFor="file-upload" className="custom-file-upload">
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={!Capacitor.isNativePlatform() ? handleImageUpload : undefined}
            style={Capacitor.isNativePlatform() ? { display: 'none' } : {}} // Hide input on native
          />
          <span onClick={Capacitor.isNativePlatform() ? handleImageUpload : undefined}>Upload Image</span>
        </label>
        
        {/* Main Process button */}
        {!bgRemovedImage && (
          <button
            onClick={removeBackground}
            disabled={!image || loading}
            className="process-button"
          >
            {loading ? 'Processing...' : 'Remove Background'}
          </button>
        )}

        {/* Download button for Preview */}
        {bgRemovedImage && (
          <button
            onClick={() => downloadImage('preview')}
            disabled={loading}
            className="download-button"
          >
            Download
          </button>
        )}
      </div>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <div className="content-container">
        <div className="image-section">
          <h3>Original Image</h3>
          {image ? (
            <div className="image-wrapper">
              <img src={image} alt="Original" />
            </div>
          ) : (
            <p>Upload an image to start.</p>
          )}
        </div>

        <div className="image-section">
          <h3>Processed Image</h3>
          {loading && <p>Processing...</p>}
          {bgRemovedImage ? (
            <div className="image-wrapper">
              <img src={bgRemovedImage} alt="Background Removed" />
            </div>
          ) : (
            !loading && <p>Result will appear here.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackgroundRemover;