import React, { useRef, useState } from "react";
import Image from "next/image";

interface ProfilePictureUploadProps {
  currentPictureUrl?: string;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
  uploading?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentPictureUrl,
  onUpload,
  onRemove,
  uploading = false,
  size = "lg",
  className = "",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-32 h-32",
    lg: "w-52 h-52",
  };

  const handleFileSelect = async (file: File) => {
    if (!file || !file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    try {
      await onUpload(file);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image. Please try again.");
    }
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          border-2 border-dashed 
          ${dragOver ? "border-primary bg-primary/10" : "border-gray-400"} 
          ${
            uploading
              ? "opacity-50"
              : "cursor-pointer hover:border-primary hover:bg-primary/5"
          }
          flex items-center justify-center
          transition-all duration-200
          overflow-hidden
          ${currentPictureUrl ? "border-solid border-gray-300" : ""}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        {currentPictureUrl ? (
          <Image
            src={`${currentPictureUrl}`}
            alt="Profile picture"
            fill
            className="object-cover rounded-full"
          />
        ) : (
          <div className="text-center text-gray-400">
            {size === "lg" && (
              <>
                <div className="text-sm">
                  {uploading ? "Uploading..." : "Click or drag to upload"}
                </div>
              </>
            )}
            {size === "md" && (
              <>
                <div className="text-2xl mb-1">📷</div>
                <div className="text-xs">Upload</div>
              </>
            )}
            {size === "sm" && <div className="text-lg">📷</div>}
          </div>
        )}
      </div>

      {/* Remove button */}
      {currentPictureUrl && onRemove && !uploading && (
        <button
          onClick={handleRemove}
          className="absolute -top-2 -right-2 w-6 h-6 bg-secondary text-black rounded-full text-sm hover:bg-white cursor-pointer transition-colors"
          title="Remove profile picture"
        >
          <span className="mt-4">X</span>
        </button>
      )}

      {/* Loading overlay */}
      {uploading && (
        <div
          className={`
          absolute inset-0 
          ${sizeClasses[size]} 
          rounded-full 
          bg-black/50 
          flex items-center justify-center
        `}
        >
          <div className="text-white text-sm">Uploading...</div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
};

export default ProfilePictureUpload;
