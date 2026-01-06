import { useState, useRef } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { X } from "lucide-react";
import "./ImageCropper.css";

const ImageCropper = ({ imageUrl, onCropComplete, onClose }) => {
  const aspectRatio = 1;
  const [crop, setCrop] = useState({
    unit: "%",
    width: 50,
    height: 50,
    x: 25,
    y: 25,
    aspect: aspectRatio,
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);

  const handleValidateCrop = () => {
    if (!completedCrop || !imgRef.current) {
      onCropComplete(imageUrl);
      return;
    }

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = 224;
    canvas.height = 224;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, 224, 224);

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, 224, 224);

    const croppedImage = canvas.toDataURL("image/jpeg", 0.95);
    onCropComplete(croppedImage);
  };

  return (
    <div className="image-cropper-modal-overlay">
      <div className="image-cropper-modal">
        <div className="image-cropper-header">
          <h2>Recadrer votre image</h2>
          <button onClick={onClose} className="image-cropper-close-btn">
            <X size={24} />
          </button>
        </div>

        <div className="image-cropper-container">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Crop"
              style={{ maxWidth: "100%", maxHeight: "450px" }}
            />
          </ReactCrop>
        </div>

        <div className="image-cropper-controls">
          <p className="crop-info">
            Déplacez et redimensionnez le carré pour sélectionner la zone à conserver
          </p>

          <div className="action-buttons">
            <button onClick={onClose} className="btn-cancel">
              Annuler
            </button>
            <button onClick={handleValidateCrop} className="btn-validate">
              Valider le recadrage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
