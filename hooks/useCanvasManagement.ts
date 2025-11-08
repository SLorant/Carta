import { useEffect, useCallback } from "react";
import { fabric } from "fabric";
import { useMutation } from "@liveblocks/react";
import type { LiveMap, Lson } from "@liveblocks/client";
import { CanvasRefs, EditorState } from "@/types/editor.types";
import { CanvasService } from "@/services/CanvasService";
import { renderCanvas, updateBrushSettings } from "@/lib/canvas";
import { handleDelete } from "@/lib/key-events";
import { defaultNavElement } from "@/constants";
import { ActiveElement } from "@/types/type";
import { PremadeShape } from "@/types/editor.types";

export const useCanvasManagement = (
  refs: CanvasRefs,
  state: EditorState,
  operations: {
    undo: () => void;
    redo: () => void;
    canvasObjects: unknown;
  }
) => {
  // Storage mutations
  const deleteAllShapes = useMutation(({ storage }) => {
    const canvasObjects = storage.get("canvasObjects") as LiveMap<string, Lson>;
    if (!canvasObjects || canvasObjects.size === 0) return true;

    for (const [key] of canvasObjects.entries()) {
      canvasObjects.delete(key);
    }
    return canvasObjects.size === 0;
  }, []);

  const deleteShapeFromStorage = useMutation(({ storage }, objectId) => {
    const canvasObjects = storage.get("canvasObjects") as LiveMap<string, Lson>;
    canvasObjects.delete(objectId);
  }, []);

  const syncShapeInStorage = useMutation(({ storage }, object) => {
    if (!object) return;
    const { objectId } = object;
    const storageId = (object as fabric.Object & { storageId?: string })
      .storageId;

    const shapeData = object.toJSON();
    shapeData.objectId = objectId;

    // Include custom properties in storage
    if (storageId) {
      (shapeData as Record<string, unknown>).storageId = storageId;
    }

    if ((object as fabric.Object & { zIndex?: number }).zIndex !== undefined) {
      (shapeData as Record<string, unknown>).zIndex = (
        object as fabric.Object & { zIndex: number }
      ).zIndex;
    }

    if (
      (object as fabric.Object & { premadeName?: string }).premadeName !==
      undefined
    ) {
      (shapeData as Record<string, unknown>).premadeName = (
        object as fabric.Object & { premadeName: string }
      ).premadeName;
    }

    const canvasObjects = storage.get("canvasObjects") as LiveMap<string, Lson>;
    const storageKey = storageId || objectId;
    if (storageKey) canvasObjects?.set(storageKey, shapeData);
  }, []);

  // Active element handling
  const handleActiveElement = useCallback(
    (elem: ActiveElement) => {
      state.setActiveElement(elem);

      // Handle delete case first
      if (elem?.value === "delete") {
        if (refs.fabricRef.current) {
          handleDelete(refs.fabricRef.current, deleteShapeFromStorage);
          state.setActiveElement(defaultNavElement);
        }
        return;
      }

      // Clear all references and canvas selection when switching tools
      refs.activeObjectRef.current = null;
      refs.selectedShapeRef.current = null;
      refs.shapeRef.current = null;

      if (refs.fabricRef.current) {
        refs.fabricRef.current.discardActiveObject();
        refs.fabricRef.current.renderAll();
        
        // Disable drawing mode when switching away from color tool
        if (elem?.value !== "color") {
          refs.fabricRef.current.isDrawingMode = false;
        }
      }

      switch (elem?.value) {
        case "select":
          refs.isDrawing.current = false;
          if (refs.fabricRef.current) {
            refs.fabricRef.current.isDrawingMode = false;
          }
          break;
        case "color":
          // Configure brush immediately when color tool is selected
          if (refs.fabricRef.current) {
            refs.fabricRef.current.isDrawingMode = true;
            updateBrushSettings(refs.fabricRef.current, {
              width: parseInt(state.elementAttributes.brushWidth),
              color: state.elementAttributes.brushColor,
              opacity: parseFloat(state.elementAttributes.opacity),
            });
          }
          break;
        case "reset":
          deleteAllShapes();
          refs.fabricRef.current?.clear();
          state.setActiveElement(defaultNavElement);
          break;
        case "image":
          refs.imageInputRef.current?.click();
          refs.isDrawing.current = false;
          if (refs.fabricRef.current) {
            refs.fabricRef.current.isDrawingMode = false;
          }
          refs.selectedShapeRef.current = null;
          return;
        case "premade-shapes":
          state.setIsPremadeShapesModalOpen(true);
          refs.isDrawing.current = false;
          if (refs.fabricRef.current) {
            refs.fabricRef.current.isDrawingMode = false;
          }
          refs.selectedShapeRef.current = null;
          return;
        case "rectangle":
        case "circle":
        case "line":
        case "triangle":
          // Ensure drawing mode is disabled for shape tools
          refs.isDrawing.current = false;
          if (refs.fabricRef.current) {
            refs.fabricRef.current.isDrawingMode = false;
          }
          break;
        default:
          // For any other tool, ensure drawing mode is disabled
          refs.isDrawing.current = false;
          if (refs.fabricRef.current) {
            refs.fabricRef.current.isDrawingMode = false;
          }
          break;
      }

      refs.selectedShapeRef.current =
        elem?.value === "select" ? null : (elem?.value as string);
    },
    [deleteAllShapes, deleteShapeFromStorage, refs, state]
  );

  // Premade shape handling
  const handlePremadeShapeSelect = useCallback(
    (shape: PremadeShape) => {
      refs.selectedShapeRef.current = `premade:${shape.src}:${shape.name}`;
      state.setActiveElement({
        icon: "/castle.svg",
        name: "Premade Shapes",
        value: "premade-shapes",
      });
    },
    [refs, state]
  );

  // Canvas initialization - run once on mount
  useEffect(() => {
    let isInitialized = false;

    const initializeCanvas = () => {
      if (!refs.canvasRef.current || isInitialized) {
        return;
      }

      const canvas = CanvasService.initializeCanvas(refs, state, {
        syncShapeInStorage,
        handleActiveElement,
        undo: operations.undo,
        redo: operations.redo,
        deleteShapeFromStorage,
      });

      if (canvas) {
        isInitialized = true;
        state.setIsCanvasInitialized(true);
      }
    };

    const timeoutId = setTimeout(initializeCanvas, 100);

    return () => {
      clearTimeout(timeoutId);
      isInitialized = false;
      if (refs.fabricRef.current) {
        CanvasService.cleanup(refs.fabricRef.current);
        refs.fabricRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Canvas rendering - refs are stable and don't need to be dependencies
  useEffect(() => {
    if (state.isCanvasInitialized && refs.fabricRef.current) {
      renderCanvas({
        activeObjectRef: refs.activeObjectRef,
        canvasObjects: operations.canvasObjects as unknown as fabric.Object[],
        fabricRef: refs.fabricRef,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operations.canvasObjects, state.isCanvasInitialized]);

  // Brush settings update - refs are stable and don't need to be dependencies
  useEffect(() => {
    if (refs.fabricRef.current && refs.selectedShapeRef.current === "color") {
      updateBrushSettings(refs.fabricRef.current, {
        width: parseInt(state.elementAttributes.brushWidth),
        color: state.elementAttributes.brushColor,
        opacity: parseFloat(state.elementAttributes.opacity),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.elementAttributes.brushWidth,
    state.elementAttributes.brushColor,
    state.elementAttributes.opacity,
  ]);

  // Delete key handling - refs and state setters are stable
  useEffect(() => {
    const onKeyUp = (event: KeyboardEvent) => {
      // Check if the target is an input field to avoid interfering with text editing
      const target = event.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      if (
        event.key === "Delete" &&
        !isInputField &&
        refs.fabricRef.current
      ) {
        handleDelete(refs.fabricRef.current, deleteShapeFromStorage);
      }
    };

    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteShapeFromStorage]);

  return {
    deleteAllShapes,
    deleteShapeFromStorage,
    syncShapeInStorage,
    handleActiveElement,
    handlePremadeShapeSelect,
  };
};
