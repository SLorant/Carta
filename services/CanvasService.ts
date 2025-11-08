import { fabric } from "fabric";
import {
  handleCanvaseMouseMove,
  handleCanvasMouseDown,
  handleCanvasMouseUp,
  handleCanvasObjectModified,
  handleCanvasObjectScaling,
  handleCanvasSelectionCreated,
  handleCanvasSelectionUpdated,
  handlePathCreated,
  handleResize,
  handleCanvasZoom,
  initializeFabric,
} from "@/lib/canvas";
import { CanvasEventHandler } from "@/lib/canvas/handlers/CanvasEventHandler";
import { handleKeyDown } from "@/lib/key-events";
import {
  CanvasRefs,
  EditorState,
  CanvasEventHandlers,
} from "@/types/editor.types";
import { CustomFabricObject, ActiveElement } from "@/types/type";

export class CanvasService {
  /**
   * Initialize the fabric canvas with all event listeners
   */
  static initializeCanvas(
    refs: CanvasRefs,
    state: EditorState,
    operations: {
      syncShapeInStorage: (object: fabric.Object) => void;
      syncMultipleShapesInStorage: (objects: fabric.Object[]) => void;
      handleActiveElement: (elem: ActiveElement) => void;
      undo: () => void;
      redo: () => void;
      deleteShapeFromStorage: (objectId: string) => void;
    }
  ): fabric.Canvas | null {
    if (!refs.canvasRef.current) {
      return null;
    }

    const canvas = initializeFabric({
      canvasRef: refs.canvasRef,
      fabricRef: refs.fabricRef,
    });

    // Create event handlers
    const eventHandlers = CanvasService.createEventHandlers(
      refs,
      state,
      operations,
      canvas
    );

    // Attach event listeners
    CanvasService.attachEventListeners(canvas, eventHandlers);

    // Attach window event listeners and store cleanup function
    const windowListeners = CanvasService.attachWindowEventListeners(
      canvas,
      operations
    );

    // Store cleanup function on canvas for later use
    (canvas as fabric.Canvas & { _windowCleanup?: () => void })._windowCleanup =
      windowListeners.cleanup;

    return canvas;
  }

  /**
   * Create all canvas event handlers
   */
  private static createEventHandlers(
    refs: CanvasRefs,
    state: EditorState,
    operations: {
      syncShapeInStorage: (object: fabric.Object) => void;
      syncMultipleShapesInStorage: (objects: fabric.Object[]) => void;
      handleActiveElement: (elem: ActiveElement) => void;
      undo: () => void;
      redo: () => void;
      deleteShapeFromStorage: (objectId: string) => void;
    },
    canvas: fabric.Canvas
  ): CanvasEventHandlers {
    return {
      onMouseDown: (options) => {
        handleCanvasMouseDown({
          canvas,
          options,
          isDrawing: refs.isDrawing,
          shapeRef: refs.shapeRef,
          selectedShapeRef: refs.selectedShapeRef,
          activeObjectRef: refs.activeObjectRef,
          isPanning: refs.isPanning,
          lastPanPoint: refs.lastPanPoint,
          syncShapeInStorage: operations.syncShapeInStorage,
          setActiveElement: operations.handleActiveElement,
          brushSettings: {
            width: parseInt(state.elementAttributes.brushWidth),
            color: state.elementAttributes.brushColor,
            opacity: parseFloat(state.elementAttributes.opacity),
          },
        });
      },

      onMouseUp: (options) => {
        handleCanvasMouseUp({
          isDrawing: refs.isDrawing,
          shapeRef: refs.shapeRef,
          selectedShapeRef: refs.selectedShapeRef,
          syncShapeInStorage: operations.syncShapeInStorage,
          isPanning: refs.isPanning,
          lastPanPoint: refs.lastPanPoint,
          options,
          canvas,
        });
      },

      onMouseMove: (options) => {
        handleCanvaseMouseMove({
          canvas,
          options,
          isDrawing: refs.isDrawing,
          shapeRef: refs.shapeRef,
          selectedShapeRef: refs.selectedShapeRef,
          isPanning: refs.isPanning,
          lastPanPoint: refs.lastPanPoint,
        });
      },

      onObjectModified: (options) => {
        handleCanvasObjectModified({
          options,
        });
      },

      onSelectionCreated: (options) => {
        handleCanvasSelectionCreated({
          options,
          isEditingRef: refs.isEditingRef,
          setElementAttributes: state.setElementAttributes,
          setActiveElement: state.setActiveElement,
          selectedShapeRef: refs.selectedShapeRef,
        });
      },

      onSelectionUpdated: (options) => {
        handleCanvasSelectionUpdated({
          options,
          isEditingRef: refs.isEditingRef,
          setElementAttributes: state.setElementAttributes,
          setActiveElement: state.setActiveElement,
          selectedShapeRef: refs.selectedShapeRef,
        });
      },

      onSelectionCleared: () => {
        CanvasEventHandler.handleCanvasSelectionCleared({
          canvas,
          syncMultipleShapesInStorage: operations.syncMultipleShapesInStorage,
        });
      },

      onObjectScaling: (options) => {
        handleCanvasObjectScaling({
          options,
          setElementAttributes: state.setElementAttributes,
        });
      },

      onPathCreated: (options) => {
        handlePathCreated({
          options: options as unknown as fabric.IEvent & {
            path: CustomFabricObject;
          },
          syncShapeInStorage: operations.syncShapeInStorage,
          selectedShapeRef: refs.selectedShapeRef,
          elementAttributes: state.elementAttributes,
        });
      },

      onMouseWheel: (options) => {
        handleCanvasZoom({
          options: options as fabric.IEvent & { e: WheelEvent },
          canvas,
        });
      },
    };
  }

  /**
   * Attach event listeners to the canvas
   */
  private static attachEventListeners(
    canvas: fabric.Canvas,
    handlers: CanvasEventHandlers
  ): void {
    canvas.on("mouse:down", handlers.onMouseDown);
    canvas.on("mouse:up", handlers.onMouseUp);
    canvas.on("mouse:move", handlers.onMouseMove);
    canvas.on("object:modified", handlers.onObjectModified);
    canvas.on("selection:created", handlers.onSelectionCreated);
    canvas.on("selection:updated", handlers.onSelectionUpdated);
    canvas.on("selection:cleared", handlers.onSelectionCleared);
    canvas.on("object:scaling", handlers.onObjectScaling);
    canvas.on("path:created", handlers.onPathCreated);
    canvas.on("mouse:wheel", handlers.onMouseWheel);
  }

  /**
   * Attach window event listeners
   */
  private static attachWindowEventListeners(
    canvas: fabric.Canvas,
    operations: {
      undo: () => void;
      redo: () => void;
      deleteShapeFromStorage: (objectId: string) => void;
      syncShapeInStorage: (object: fabric.Object) => void;
      syncMultipleShapesInStorage: (objects: fabric.Object[]) => void;
    }
  ): { cleanup: () => void } {
    const handleWindowResize = () => {
      handleResize({ canvas });
    };

    const handleWindowKeyDown = (e: KeyboardEvent) => {
      handleKeyDown({
        e,
        canvas,
        undo: operations.undo,
        deleteShapeFromStorage: operations.deleteShapeFromStorage,
        redo: operations.redo,
        syncShapeInStorage: operations.syncShapeInStorage,
      });
    };

    window.addEventListener("resize", handleWindowResize);
    window.addEventListener("keydown", handleWindowKeyDown);

    // Return cleanup function
    return {
      cleanup: () => {
        window.removeEventListener("resize", handleWindowResize);
        window.removeEventListener("keydown", handleWindowKeyDown);
      },
    };
  }

  /**
   * Cleanup canvas and event listeners
   */
  static cleanup(canvas: fabric.Canvas | null): void {
    if (canvas) {
      // Clean up window event listeners if they exist
      const canvasWithCleanup = canvas as fabric.Canvas & {
        _windowCleanup?: () => void;
      };
      if (canvasWithCleanup._windowCleanup) {
        canvasWithCleanup._windowCleanup();
      }
      canvas.dispose();
    }
  }
}
