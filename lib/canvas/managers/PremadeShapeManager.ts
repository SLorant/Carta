import { fabric } from "fabric";
import { v4 as uuid4 } from "uuid";
import { FabricObjectWithId } from "../types/canvas.types";
import { ZIndexManager } from "../managers/ZIndexManager";
import { CANVAS_CONSTANTS } from "../constants/canvas.constants";

export class PremadeShapeManager {
  private static isCreatingPremadeShape = false;

  /**
   * Creates a premade shape at the specified location
   */
  static createPremadeShape(
    canvas: fabric.Canvas,
    pointer: { x: number; y: number },
    premadeData: string,
    syncShapeInStorage: (shape: fabric.Object) => void
  ): void {
    // Prevent multiple rapid creations
    if (PremadeShapeManager.isCreatingPremadeShape) return;
    PremadeShapeManager.isCreatingPremadeShape = true;

    const [shapeSrc, shapeName] = premadeData.split(":");
    const displayName =
      shapeName || shapeSrc.split("/").pop()?.split(".")[0] || "Image";

    // Safety timeout to reset flag in case of errors
    const resetTimeout = setTimeout(() => {
      PremadeShapeManager.isCreatingPremadeShape = false;
    }, CANVAS_CONSTANTS.TIMEOUTS.PREMADE_CREATION);

    // Create a new image instance for placement
    fabric.Image.fromURL(shapeSrc, (img) => {
      // Clear the timeout and reset creation state when image is loaded
      clearTimeout(resetTimeout);
      PremadeShapeManager.isCreatingPremadeShape = false;

      // Check if image loaded successfully
      if (!img || !img.getElement()) {
        console.error("Failed to load premade shape image:", shapeSrc);
        return;
      }

      PremadeShapeManager.configureImageShape(img, pointer, displayName);
      PremadeShapeManager.addShapeToCanvas(canvas, img, syncShapeInStorage);
    });
  }

  /**
   * Configures the image shape properties
   */
  private static configureImageShape(
    img: fabric.Image,
    pointer: { x: number; y: number },
    displayName: string
  ): void {
    img.scaleToWidth(CANVAS_CONSTANTS.SHAPES.DEFAULT_SIZE);
    img.scaleToHeight(CANVAS_CONSTANTS.SHAPES.DEFAULT_SIZE);

    // Position the image at the clicked location
    img.set({
      left: pointer.x - (img.width! * img.scaleX!) / 2,
      top: pointer.y - (img.height! * img.scaleY!) / 2,
    });

    // Set objectId and premade shape name for the image
    const imgWithId = img as FabricObjectWithId;
    imgWithId.objectId = uuid4();
    imgWithId.premadeName = displayName;
  }

  /**
   * Adds the shape to canvas with proper z-index
   */
  private static addShapeToCanvas(
    canvas: fabric.Canvas,
    img: fabric.Image,
    syncShapeInStorage: (shape: fabric.Object) => void
  ): void {
    // Add the image to canvas
    canvas.add(img);

    // Assign z-index based on current canvas position
    ZIndexManager.assignZIndex(img as FabricObjectWithId, canvas);

    // Reorder objects to maintain proper z-index layering
    ZIndexManager.reorderObjectsByZIndex(canvas);

    // Sync to storage and render
    syncShapeInStorage(img);
    canvas.renderAll();
  }

  /**
   * Checks if a shape reference is a premade shape
   */
  static isPremadeShape(selectedShape: string | null): boolean {
    return (
      selectedShape?.startsWith(CANVAS_CONSTANTS.SHAPES.PREMADE_PREFIX) || false
    );
  }

  /**
   * Extracts premade data from shape reference
   */
  static extractPremadeData(selectedShape: string): string {
    return selectedShape.replace(CANVAS_CONSTANTS.SHAPES.PREMADE_PREFIX, "");
  }
}
