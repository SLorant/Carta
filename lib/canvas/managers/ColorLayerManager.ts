import { fabric } from "fabric";
import { v4 as uuid4 } from "uuid";
import { FabricObjectWithId } from "../types/canvas.types";
import { ZIndexManager } from "../managers/ZIndexManager";
import { CANVAS_CONSTANTS } from "../constants/canvas.constants";

export class ColorLayerManager {
  /**
   * Creates and configures a color layer path
   */
  static createColorLayerPath(
    path: fabric.Path,
    canvas: fabric.Canvas,
    syncShapeInStorage: (shape: fabric.Object) => void,
    elementAttributes?: { opacity?: string }
  ): void {
    // Apply opacity to the new path before adding it
    if (elementAttributes?.opacity) {
      path.set({
        opacity: parseFloat(elementAttributes.opacity),
      });
    }

    // Configure path as non-interactive color layer
    ColorLayerManager.configureColorLayerProperties(path);

    // Set the objectId and storageId
    const pathWithId = path as FabricObjectWithId;
    pathWithId.objectId = CANVAS_CONSTANTS.COLORS.LAYER_OBJECT_ID;
    pathWithId.storageId = uuid4();

    // Handle z-index for proper layering
    ColorLayerManager.setColorLayerZIndex(path, canvas);

    // Reorder objects to ensure proper layering based on z-index
    ZIndexManager.reorderObjectsByZIndex(canvas);

    canvas.renderAll();
    syncShapeInStorage(path);
  }

  /**
   * Configures properties for color layer objects
   */
  static configureColorLayerProperties(obj: fabric.Object): void {
    obj.set({
      selectable: false,
      evented: false,
      hoverCursor: "default",
      moveCursor: "default",
      excludeFromExport: false,
      hasControls: false,
      hasBorders: false,
      lockMovementX: true,
      lockMovementY: true,
      lockRotation: true,
      lockScalingX: true,
      lockScalingY: true,
      lockUniScaling: true,
    });
  }

  /**
   * Sets appropriate z-index for color layer objects
   */
  static setColorLayerZIndex(path: fabric.Object, canvas: fabric.Canvas): void {
    // Get existing color paths to maintain proper layering among color objects
    let colorZIndex = CANVAS_CONSTANTS.COLORS.BASE_Z_INDEX;

    const maxColorZIndex = ZIndexManager.getMaxColorZIndex(canvas, path);
    if (maxColorZIndex > CANVAS_CONSTANTS.COLORS.BASE_Z_INDEX) {
      colorZIndex = maxColorZIndex + 1;
    }

    // Set the z-index for the new path
    (path as FabricObjectWithId).zIndex = colorZIndex;
  }

  /**
   * Checks if an object is a color layer
   */
  static isColorLayer(obj: fabric.Object): boolean {
    const objWithId = obj as FabricObjectWithId;
    return objWithId.objectId === CANVAS_CONSTANTS.COLORS.LAYER_OBJECT_ID;
  }

  /**
   * Handles color layer selection (deselects them)
   */
  static handleColorLayerSelection(obj: fabric.Object): boolean {
    if (ColorLayerManager.isColorLayer(obj)) {
      const canvas = obj.canvas as fabric.Canvas;
      if (canvas) {
        canvas.discardActiveObject();
        canvas.renderAll();
      }
      return true;
    }
    return false;
  }
}
