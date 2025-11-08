import { fabric } from "fabric";
import { FabricObjectWithId } from "../types/canvas.types";

export class ZIndexManager {
  /**
   * Reorders all objects on canvas based on their z-index
   */
  static reorderObjectsByZIndex(canvas: fabric.Canvas): void {
    const objects = canvas.getObjects();

    // Sort all objects by z-index
    objects.sort((a, b) => {
      const aZIndex = (a as FabricObjectWithId).zIndex || 0;
      const bZIndex = (b as FabricObjectWithId).zIndex || 0;
      return aZIndex - bZIndex;
    });

    // Reorder objects on canvas based on sorted z-index
    objects.forEach((obj, targetIndex) => {
      const currentIndex = canvas.getObjects().indexOf(obj);
      if (currentIndex !== targetIndex) {
        canvas.moveTo(obj, targetIndex);
      }
    });
  }

  /**
   * Assigns z-index to a new object based on its type and position
   */
  static assignZIndex(
    obj: FabricObjectWithId,
    canvas: fabric.Canvas,
    isColorLayer: boolean = false
  ): void {
    const objects = canvas.getObjects();
    const newIndex = objects.length - 1;

    if (isColorLayer) {
      // Color layers get negative z-index
      obj.zIndex = -1000 + newIndex;
    } else {
      // Regular objects get positive z-index
      obj.zIndex = newIndex;
    }
  }

  /**
   * Gets the highest z-index among color paths
   */
  static getMaxColorZIndex(
    canvas: fabric.Canvas,
    excludeObj?: fabric.Object
  ): number {
    const existingColorPaths = canvas
      .getObjects()
      .filter((obj: fabric.Object) => {
        const objWithId = obj as FabricObjectWithId;
        return objWithId.objectId === "color-layer" && obj !== excludeObj;
      });

    if (existingColorPaths.length === 0) {
      return -1000; // Base low z-index for first color stroke
    }

    return Math.max(
      ...existingColorPaths.map(
        (obj: fabric.Object) => (obj as FabricObjectWithId).zIndex || -1000
      )
    );
  }
}
