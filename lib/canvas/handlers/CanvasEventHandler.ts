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
  static handleCanvasObjectModified({
    options,
    syncShapeInStorage,
  }: CanvasObjectModified): void {
    const target = options.target;
    if (!target) return;

    if (target?.type === "activeSelection") {
      // Multiple selection handling - skip for now, handle in selection:cleared
      return;
    } else {
      // Single object handling - this works perfectly
      syncShapeInStorage(target);
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
    syncShapeInStorage,
  }: {
    canvas: fabric.Canvas;
    syncShapeInStorage: (shape: fabric.Object) => void;
  }): void {
    // When selection is cleared, sync all objects to ensure positions are saved
    canvas.getObjects().forEach((obj) => {
      obj.setCoords();
      syncShapeInStorage(obj);
    });
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
