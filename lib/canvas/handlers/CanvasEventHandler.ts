import { fabric } from "fabric";
import { v4 as uuid4 } from "uuid";
import {
  CanvasObjectModified,
  CanvasPathCreated,
  CanvasSelectionCreated,
  CanvasObjectScaling,
  Attributes,
} from "@/types/type";
import { ColorLayerManager } from "../managers/ColorLayerManager";

export class CanvasEventHandler {
  /**
   * Handles object modification events
   */
  static handleCanvasObjectModified({ options }: CanvasObjectModified): void {
    const target = options.target;
    if (!target) return;

    if (target?.type === "activeSelection") {
      // Multiple selection handling - mark all objects as modified, don't sync yet
      const activeSelection = target as fabric.ActiveSelection;
      activeSelection.forEachObject((obj: fabric.Object) => {
        (obj as fabric.Object & { _wasModified?: boolean })._wasModified = true;
      });
      return;
    } else {
      // Single object handling - only mark as modified for movements
      // Sync will happen when selection is cleared to create single undo entry
      (target as fabric.Object & { _wasModified?: boolean })._wasModified =
        true;
    }
  }

  /**
   * Handles path creation events for freeform drawing
   */
  static handlePathCreated({
    options,
    syncShapeInStorage,
    selectedShapeRef,
    elementAttributes,
  }: CanvasPathCreated & {
    selectedShapeRef?: React.MutableRefObject<string | null>;
    elementAttributes?: { opacity?: string };
  }): void {
    const path = options.path;
    if (!path) return;

    // Check if we're in color mode
    if (selectedShapeRef?.current === "color") {
      const canvas = path.canvas;
      if (!canvas) return;

      ColorLayerManager.createColorLayerPath(
        path as fabric.Path,
        canvas,
        syncShapeInStorage,
        elementAttributes
      );
      return;
    }

    // Normal freeform behavior
    path.set({
      objectId: uuid4(),
    });

    syncShapeInStorage(path);
  }

  /**
   * Handles selection creation events
   */
  static handleCanvasSelectionCreated({
    options,
    isEditingRef,
    setElementAttributes,
  }: CanvasSelectionCreated): void {
    // Reset editing state when a new selection is made
    isEditingRef.current = false;

    if (!options?.selected) return;

    // Check if the selected object is a color layer path - if so, deselect it
    const selectedObj = options?.selected[0] as fabric.Object;
    if (ColorLayerManager.isColorLayer(selectedObj)) {
      ColorLayerManager.handleColorLayerSelection(selectedObj);
      return;
    }

    // Get the selected element
    const selectedElement = options?.selected[0] as fabric.Object & {
      fontSize: number;
      fontFamily: string;
      fontWeight: string;
    };

    if (selectedElement && options.selected.length === 1) {
      CanvasEventHandler.updateElementAttributes(
        selectedElement,
        setElementAttributes
      );
    }
  }

  /**
   * Handles selection update events
   */
  static handleCanvasSelectionUpdated({
    options,
    isEditingRef,
    setElementAttributes,
    setActiveElement,
    selectedShapeRef,
  }: CanvasSelectionCreated): void {
    selectedShapeRef.current = null;
    setActiveElement({
      icon: "/assets/select.svg",
      name: "Select",
      value: "select",
    });

    CanvasEventHandler.handleCanvasSelectionCreated({
      options,
      isEditingRef,
      setElementAttributes,
      setActiveElement,
      selectedShapeRef,
    });
  }

  /**
   * Handles selection cleared events - sync positions when selection is lost
   */
  static handleCanvasSelectionCleared({
    canvas,
    syncMultipleShapesInStorage,
  }: {
    canvas: fabric.Canvas;
    syncMultipleShapesInStorage: (objects: fabric.Object[]) => void;
  }): void {
    // Only sync objects that have been marked as modified during movement
    const modifiedObjects = canvas.getObjects().filter((obj) => {
      return (obj as fabric.Object & { _wasModified?: boolean })._wasModified;
    });

    if (modifiedObjects.length > 0) {
      modifiedObjects.forEach((obj) => {
        obj.setCoords();
        // Clear the modification flag
        delete (obj as fabric.Object & { _wasModified?: boolean })._wasModified;
      });

      // Use batch sync for better undo/redo support
      syncMultipleShapesInStorage(modifiedObjects);
    }
  }

  /**
   * Handles object scaling events
   */
  static handleCanvasObjectScaling({
    options,
    setElementAttributes,
  }: CanvasObjectScaling): void {
    const selectedElement = options.target;

    const scaledWidth = selectedElement?.scaleX
      ? (selectedElement?.width ?? 0) * selectedElement?.scaleX
      : selectedElement?.width;

    const scaledHeight = selectedElement?.scaleY
      ? (selectedElement?.height ?? 0) * selectedElement?.scaleY
      : selectedElement?.height;

    setElementAttributes((prev) => ({
      ...prev,
      width: scaledWidth?.toFixed(0).toString() || "",
      height: scaledHeight?.toFixed(0).toString() || "",
    }));
  }

  /**
   * Handles object movement within canvas boundaries
   */
  static handleCanvasObjectMoving({
    options,
  }: {
    options: fabric.IEvent;
  }): void {
    const target = options.target as fabric.Object;
    const canvas = target.canvas as fabric.Canvas;

    target.setCoords();

    // Restrict object to canvas boundaries (horizontal)
    if (target && target.left) {
      target.left = Math.max(
        0,
        Math.min(
          target.left,
          (canvas.width || 0) - (target.getScaledWidth() || target.width || 0)
        )
      );
    }

    // Restrict object to canvas boundaries (vertical)
    if (target && target.top) {
      target.top = Math.max(
        0,
        Math.min(
          target.top,
          (canvas.height || 0) -
            (target.getScaledHeight() || target.height || 0)
        )
      );
    }
  }

  /**
   * Updates element attributes based on selected object
   */
  private static updateElementAttributes(
    selectedElement: fabric.Object & {
      fontSize?: number;
      fontFamily?: string;
      fontWeight?: string;
    },
    setElementAttributes: React.Dispatch<React.SetStateAction<Attributes>>
  ): void {
    const scaledWidth = selectedElement?.scaleX
      ? (selectedElement?.width ?? 0) * selectedElement?.scaleX
      : selectedElement?.width;

    const scaledHeight = selectedElement?.scaleY
      ? (selectedElement?.height ?? 0) * selectedElement?.scaleY
      : selectedElement?.height;

    setElementAttributes({
      width: scaledWidth?.toFixed(0).toString() || "",
      height: scaledHeight?.toFixed(0).toString() || "",
      fill: selectedElement?.fill?.toString() || "",
      stroke: selectedElement?.stroke || "",
      fontSize: selectedElement?.fontSize?.toString() || "",
      fontFamily: selectedElement?.fontFamily || "",
      fontWeight: selectedElement?.fontWeight || "",
      opacity: selectedElement?.opacity?.toString() || "1",
      brushWidth: "20",
      brushColor: "#ffffff",
    });
  }
}
