import { useEffect, useState } from "react";
import { fabric } from "fabric";

/**
 * Hook to get the current canvas viewport transform
 * This includes zoom level and pan offset
 */
export const useCanvasViewport = (
  fabricRef: React.MutableRefObject<fabric.Canvas | null>
) => {
  const [viewport, setViewport] = useState({
    zoom: 1,
    panX: 0,
    panY: 0,
  });

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const updateViewport = () => {
      const zoom = canvas.getZoom();
      const vpt = canvas.viewportTransform;

      setViewport({
        zoom,
        panX: vpt ? vpt[4] : 0,
        panY: vpt ? vpt[5] : 0,
      });
    };

    // Update viewport on canvas events
    canvas.on("after:render", updateViewport);
    canvas.on("mouse:wheel", updateViewport);
    canvas.on("mouse:up", updateViewport);

    // Initial viewport state
    updateViewport();

    return () => {
      canvas.off("after:render", updateViewport);
      canvas.off("mouse:wheel", updateViewport);
      canvas.off("mouse:up", updateViewport);
    };
  }, [fabricRef]);

  /**
   * Transform stored canvas coordinates to current screen coordinates
   * The stored coordinates are in the original canvas coordinate space
   */
  const transformCanvasToScreen = (originalX: number, originalY: number) => {
    const canvas = fabricRef.current;
    if (!canvas) return { x: originalX, y: originalY };

    const zoom = canvas.getZoom();
    const vpt = canvas.viewportTransform;
    if (!vpt) return { x: originalX, y: originalY };

    // The stored coordinates are in canvas space, apply current transformations
    const screenX = originalX * (zoom / 1.6) + vpt[4];
    const screenY = originalY * (zoom / 1.6) + vpt[5];

    return { x: screenX, y: screenY };
  };

  /**
   * Transform current screen coordinates to canvas coordinate space for storage
   */
  const transformScreenToCanvas = (screenX: number, screenY: number) => {
    const canvas = fabricRef.current;
    if (!canvas) return { x: screenX, y: screenY };

    const zoom = canvas.getZoom();
    const vpt = canvas.viewportTransform;
    if (!vpt) return { x: screenX, y: screenY };

    // Remove current transformations to get original canvas coordinates
    const canvasX = (screenX - vpt[4]) / zoom;
    const canvasY = (screenY - vpt[5]) / zoom;

    return { x: canvasX, y: canvasY };
  };

  return {
    viewport,
    transformCanvasToScreen,
    transformScreenToCanvas,
  };
};
