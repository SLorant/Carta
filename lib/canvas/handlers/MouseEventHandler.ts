import { fabric } from "fabric";
import { createSpecificShape } from "../../shapes";
import { FabricObjectWithId, BrushSettings } from "../types/canvas.types";
import { ZIndexManager } from "../managers/ZIndexManager";
import { BrushManager } from "../managers/BrushManager";
import { PremadeShapeManager } from "../managers/PremadeShapeManager";
import { ColorLayerManager } from "../managers/ColorLayerManager";
import {
  CanvasMouseDown,
  CanvasMouseMove,
  CanvasMouseUp,
  ActiveElement,
} from "@/types/type";

export class MouseEventHandler {
  /**
   * Handles canvas mouse down events
   */
  static handleCanvasMouseDown({
    options,
    canvas,
    selectedShapeRef,
    isDrawing,
    shapeRef,
    activeObjectRef,
    isPanning,
    lastPanPoint,
    syncShapeInStorage,
    setActiveElement,
    brushSettings,
  }: CanvasMouseDown): void {
    const evt = options.e as MouseEvent;

    // Handle panning with middle mouse button
    if (evt.button === 1) {
      MouseEventHandler.startPanning(evt, isPanning, lastPanPoint, canvas);
      return;
    }

    const pointer = canvas.getPointer(options.e);
    const target = MouseEventHandler.findValidTarget(canvas, options.e);

    canvas.isDrawingMode = false;

    // Handle different interaction modes
    if (selectedShapeRef.current === "color") {
      MouseEventHandler.handleColorMode(isDrawing, canvas, brushSettings);
    } else if (target) {
      MouseEventHandler.handleTargetSelection(
        target,
        canvas,
        activeObjectRef,
        selectedShapeRef
      );
    } else if (PremadeShapeManager.isPremadeShape(selectedShapeRef.current)) {
      MouseEventHandler.handlePremadeShape(
        selectedShapeRef.current!,
        pointer,
        canvas,
        syncShapeInStorage
      );
    } else if (shapeRef.current && shapeRef.current.type === "image") {
      MouseEventHandler.handleImagePlacement(
        shapeRef,
        pointer,
        canvas,
        syncShapeInStorage,
        selectedShapeRef,
        setActiveElement
      );
    } else if (
      selectedShapeRef.current &&
      selectedShapeRef.current !== "select"
    ) {
      MouseEventHandler.handleShapeCreation(
        selectedShapeRef.current,
        pointer,
        shapeRef,
        canvas,
        isDrawing
      );
    } else {
      MouseEventHandler.handleSelectionMode(isDrawing, canvas, activeObjectRef);
    }
  }

  /**
   * Handles canvas mouse move events
   */
  static handleCanvaseMouseMove({
    options,
    canvas,
    isDrawing,
    selectedShapeRef,
    shapeRef,
    isPanning,
    lastPanPoint,
  }: CanvasMouseMove): void {
    const evt = options.e as MouseEvent;

    // Handle panning if middle mouse button is held down
    if (isPanning.current && lastPanPoint.current) {
      MouseEventHandler.handlePanning(evt, canvas, lastPanPoint);
      return;
    }

    if (!isDrawing.current || selectedShapeRef.current === "color") {
      return;
    }

    canvas.isDrawingMode = false;
    const pointer = canvas.getPointer(options.e);

    MouseEventHandler.updateShapeDimensions(
      selectedShapeRef.current,
      shapeRef.current,
      pointer
    );
    canvas.renderAll();

    // Don't sync during drawing - only sync when shape creation is complete (mouse up)
  }

  /**
   * Handles canvas mouse up events
   */
  static handleCanvasMouseUp({
    isDrawing,
    shapeRef,
    selectedShapeRef,
    syncShapeInStorage,
    isPanning,
    lastPanPoint,
    options,
    canvas,
  }: CanvasMouseUp): void {
    const evt = options.e as MouseEvent;

    // Handle panning end for middle mouse button
    if (evt.button === 1) {
      MouseEventHandler.endPanning(evt, isPanning, lastPanPoint, canvas);
      return;
    }

    isDrawing.current = false;

    if (selectedShapeRef.current === "color") {
      return;
    }

    if (shapeRef.current) {
      syncShapeInStorage(shapeRef.current);
    }

    shapeRef.current = null;
  }

  // Private helper methods
  private static startPanning(
    evt: MouseEvent,
    isPanning: React.MutableRefObject<boolean>,
    lastPanPoint: React.MutableRefObject<{ x: number; y: number } | null>,
    canvas: fabric.Canvas
  ): void {
    isPanning.current = true;
    lastPanPoint.current = { x: evt.clientX, y: evt.clientY };
    evt.preventDefault();
    evt.stopPropagation();

    const canvasElement = canvas.getElement();
    if (canvasElement) {
      canvasElement.style.cursor = "grab";
    }
  }

  private static endPanning(
    evt: MouseEvent,
    isPanning: React.MutableRefObject<boolean>,
    lastPanPoint: React.MutableRefObject<{ x: number; y: number } | null>,
    canvas: fabric.Canvas
  ): void {
    isPanning.current = false;
    lastPanPoint.current = null;
    evt.preventDefault();
    evt.stopPropagation();

    const canvasElement = canvas.getElement();
    if (canvasElement) {
      canvasElement.style.cursor = "default";
    }
  }

  private static handlePanning(
    evt: MouseEvent,
    canvas: fabric.Canvas,
    lastPanPoint: React.MutableRefObject<{ x: number; y: number } | null>
  ): void {
    if (!lastPanPoint.current) return;

    const deltaX = evt.clientX - lastPanPoint.current.x;
    const deltaY = evt.clientY - lastPanPoint.current.y;

    const vpt = canvas.viewportTransform;
    if (vpt) {
      vpt[4] += deltaX;
      vpt[5] += deltaY;
      canvas.requestRenderAll();

      canvas.getObjects().forEach((obj) => {
        obj.setCoords();
      });
    }

    lastPanPoint.current = { x: evt.clientX, y: evt.clientY };
    evt.preventDefault();
    evt.stopPropagation();
  }

  private static findValidTarget(
    canvas: fabric.Canvas,
    e: Event
  ): fabric.Object | undefined {
    let target = canvas.findTarget(e, false);

    // If the target is a color layer object, ignore it and find the next target
    if (target && ColorLayerManager.isColorLayer(target)) {
      target = undefined;
    }

    return target;
  }

  private static handleColorMode(
    isDrawing: React.MutableRefObject<boolean>,
    canvas: fabric.Canvas,
    brushSettings?: BrushSettings
  ): void {
    isDrawing.current = true;
    canvas.isDrawingMode = true;

    if (canvas.freeDrawingBrush.width !== 1) {
      BrushManager.configureFreeDrawingBrush(canvas, {
        opacity: brushSettings?.opacity,
        color: canvas.freeDrawingBrush.color,
        width: canvas.freeDrawingBrush.width,
      });
    } else if (brushSettings) {
      BrushManager.configureFreeDrawingBrush(canvas, brushSettings);
    }
  }

  private static handleTargetSelection(
    target: fabric.Object,
    canvas: fabric.Canvas,
    activeObjectRef: React.MutableRefObject<fabric.Object | null>,
    selectedShapeRef: React.MutableRefObject<string | null>
  ): void {
    canvas.setActiveObject(target);
    activeObjectRef.current = target;
    selectedShapeRef.current = null;
    target.setCoords();
  }

  private static handlePremadeShape(
    selectedShape: string,
    pointer: { x: number; y: number },
    canvas: fabric.Canvas,
    syncShapeInStorage: (shape: fabric.Object) => void
  ): void {
    const premadeData = PremadeShapeManager.extractPremadeData(selectedShape);
    PremadeShapeManager.createPremadeShape(
      canvas,
      pointer,
      premadeData,
      syncShapeInStorage
    );
  }

  private static handleImagePlacement(
    shapeRef: React.MutableRefObject<fabric.Object | null>,
    pointer: { x: number; y: number },
    canvas: fabric.Canvas,
    syncShapeInStorage: (shape: fabric.Object) => void,
    selectedShapeRef: React.MutableRefObject<string | null>,
    setActiveElement?: (element: ActiveElement) => void
  ): void {
    if (!shapeRef.current) return;

    // Position the image at the clicked location
    shapeRef.current.set({
      left:
        pointer.x - (shapeRef.current.width! * shapeRef.current.scaleX!) / 2,
      top:
        pointer.y - (shapeRef.current.height! * shapeRef.current.scaleY!) / 2,
    });

    canvas.add(shapeRef.current);
    ZIndexManager.assignZIndex(shapeRef.current as FabricObjectWithId, canvas);
    ZIndexManager.reorderObjectsByZIndex(canvas);

    syncShapeInStorage(shapeRef.current);
    canvas.renderAll();

    shapeRef.current = null;
    selectedShapeRef.current = null;

    if (setActiveElement) {
      setActiveElement({
        icon: "/assets/select.svg",
        name: "Select",
        value: "select",
      });
    }
  }

  private static handleShapeCreation(
    selectedShape: string,
    pointer: { x: number; y: number },
    shapeRef: React.MutableRefObject<fabric.Object | null>,
    canvas: fabric.Canvas,
    isDrawing: React.MutableRefObject<boolean>
  ): void {
    isDrawing.current = true;
    shapeRef.current = createSpecificShape(
      selectedShape,
      pointer as unknown as PointerEvent
    );

    if (shapeRef.current) {
      canvas.add(shapeRef.current);
      ZIndexManager.assignZIndex(
        shapeRef.current as FabricObjectWithId,
        canvas
      );
      ZIndexManager.reorderObjectsByZIndex(canvas);
    }
  }

  private static handleSelectionMode(
    isDrawing: React.MutableRefObject<boolean>,
    canvas: fabric.Canvas,
    activeObjectRef: React.MutableRefObject<fabric.Object | null>
  ): void {
    isDrawing.current = false;
    canvas.discardActiveObject();
    activeObjectRef.current = null;
    canvas.renderAll();
  }

  private static updateShapeDimensions(
    selectedShape: string | null,
    shape: fabric.Object | null,
    pointer: { x: number; y: number }
  ): void {
    if (!shape || !selectedShape) return;

    switch (selectedShape) {
      case "rectangle":
        shape.set({
          width: pointer.x - (shape.left || 0),
          height: pointer.y - (shape.top || 0),
        });
        break;

      case "circle":
        const circle = shape as fabric.Circle;
        circle.set({
          radius: Math.abs(pointer.x - (circle.left || 0)) / 2,
        } as Partial<fabric.Circle>);
        break;

      case "line":
        (shape as fabric.Line).set({
          x2: pointer.x,
          y2: pointer.y,
        });
        break;

      case "image":
        shape.set({
          width: pointer.x - (shape.left || 0),
          height: pointer.y - (shape.top || 0),
        });
        break;

      default:
        break;
    }
  }
}
