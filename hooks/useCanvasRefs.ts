import { useRef, useCallback, useMemo } from "react";
import { fabric } from "fabric";
import { CanvasRefs } from "@/types/editor.types";
import { handleZoomIn, handleZoomOut, handleZoomReset } from "@/lib/canvas";

export const useCanvasRefs = (): CanvasRefs => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const isDrawing = useRef(false);
  const shapeRef = useRef<fabric.Object | null>(null);
  const selectedShapeRef = useRef<string | null>(null);
  const activeObjectRef = useRef<fabric.Object | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const isEditingRef = useRef<boolean>(false);
  const isPanning = useRef(false);
  const lastPanPoint = useRef<{ x: number; y: number } | null>(null);

  // Memoize the refs object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      canvasRef,
      fabricRef,
      isDrawing,
      shapeRef,
      selectedShapeRef,
      activeObjectRef,
      imageInputRef,
      isEditingRef,
      isPanning,
      lastPanPoint,
    }),
    []
  );
};

export const useCanvasOperations = (
  fabricRef: React.MutableRefObject<fabric.Canvas | null>,
  deleteAllShapes: () => boolean,
  deleteShapeFromStorage: (objectId: string) => void,
  syncShapeInStorage: (object: fabric.Object) => void
) => {
  const handleZoomInCanvas = useCallback(() => {
    if (fabricRef.current) {
      handleZoomIn(fabricRef.current);
    }
  }, [fabricRef]);

  const handleZoomOutCanvas = useCallback(() => {
    if (fabricRef.current) {
      handleZoomOut(fabricRef.current);
    }
  }, [fabricRef]);

  const handleZoomResetCanvas = useCallback(() => {
    if (fabricRef.current) {
      handleZoomReset(fabricRef.current);
    }
  }, [fabricRef]);

  return {
    handleZoomInCanvas,
    handleZoomOutCanvas,
    handleZoomResetCanvas,
    deleteAllShapes,
    deleteShapeFromStorage,
    syncShapeInStorage,
  };
};
