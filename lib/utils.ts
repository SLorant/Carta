import jsPDF from "jspdf";
import { twMerge } from "tailwind-merge";
import { type ClassValue, clsx } from "clsx";

const adjectives = [
  "Happy",
  "Creative",
  "Energetic",
  "Lively",
  "Dynamic",
  "Radiant",
  "Joyful",
  "Vibrant",
  "Cheerful",
  "Sunny",
  "Sparkling",
  "Bright",
  "Shining",
];

const animals = [
  "Dolphin",
  "Tiger",
  "Elephant",
  "Penguin",
  "Kangaroo",
  "Panther",
  "Lion",
  "Cheetah",
  "Giraffe",
  "Hippopotamus",
  "Monkey",
  "Panda",
  "Crocodile",
];

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateRandomName(): string {
  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomAnimal = animals[Math.floor(Math.random() * animals.length)];

  return `${randomAdjective} ${randomAnimal}`;
}

export const getShapeInfo = (
  shapeType: string,
  shapeData?: { premadeName?: string; [key: string]: unknown }
) => {
  // Check if this is a premade shape (image type with premadeName)
  if (shapeType === "image" && shapeData?.premadeName) {
    return {
      icon: "/assets/image.svg",
      name: shapeData.premadeName,
    };
  }

  switch (shapeType) {
    case "rect":
      return {
        icon: "/assets/rectangle.svg",
        name: "Rectangle",
      };

    case "circle":
      return {
        icon: "/assets/circle.svg",
        name: "Circle",
      };

    case "line":
      return {
        icon: "/assets/line.svg",
        name: "Line",
      };

    case "i-text":
      return {
        icon: "/assets/text.svg",
        name: "Text",
      };

    case "image":
      return {
        icon: "/assets/image.svg",
        name: "Image",
      };

    case "color":
      return {
        icon: "/assets/circle.svg",
        name: "Color",
      };

    case "path":
      return {
        icon: "/assets/freeform.svg",
        name: "Drawing",
      };

    default:
      return {
        icon: "/assets/rectangle.svg",
        name: shapeType,
      };
  }
};

export const exportToPdf = async () => {
  const canvas = document.querySelector("canvas");

  if (!canvas) return;

  // Create a temporary canvas for compositing
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  if (!tempCtx) return;

  // Set the same dimensions as the original canvas
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;

  try {
    // Load and draw the background image (sea.png)
    const backgroundImg = new Image();
    backgroundImg.crossOrigin = "anonymous";

    await new Promise((resolve, reject) => {
      backgroundImg.onload = resolve;
      backgroundImg.onerror = reject;
      backgroundImg.src = "/textures/sea.png";
    });

    // Draw the background image
    tempCtx.drawImage(backgroundImg, 0, 0, tempCanvas.width, tempCanvas.height);

    // Draw the original canvas content on top
    tempCtx.drawImage(canvas, 0, 0);

    // Load and draw the overlay texture (mild.png) with multiply blend mode
    const overlayImg = new Image();
    overlayImg.crossOrigin = "anonymous";

    await new Promise((resolve, reject) => {
      overlayImg.onload = resolve;
      overlayImg.onerror = reject;
      overlayImg.src = "/textures/mild.png";
    });

    // Apply the overlay with multiply blend mode and reduced opacity
    tempCtx.globalCompositeOperation = "multiply";
    tempCtx.globalAlpha = 0.5;
    tempCtx.drawImage(overlayImg, 0, 0, tempCanvas.width, tempCanvas.height);

    // Reset blend mode and opacity
    tempCtx.globalCompositeOperation = "source-over";
    tempCtx.globalAlpha = 1.0;

    // Create PDF with the composite image
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [tempCanvas.width, tempCanvas.height],
    });

    // Get the composite canvas data
    const data = tempCanvas.toDataURL();

    // Add the composite image to the pdf
    doc.addImage(data, "PNG", 0, 0, tempCanvas.width, tempCanvas.height);

    // Download the pdf
    doc.save("canvas.pdf");
  } catch (error) {
    console.error("Error creating PDF with background:", error);

    // Fallback to original method if background loading fails
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [canvas.width, canvas.height],
    });

    const data = canvas.toDataURL();
    doc.addImage(data, "PNG", 0, 0, canvas.width, canvas.height);
    doc.save("canvas.pdf");
  }
};
