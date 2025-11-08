import { fabric } from "fabric";
import { ZoomConfig } from "../types/canvas.types";
import { CANVAS_CONSTANTS } from "../constants/canvas.constants";

export class ViewportManager {
  private static zoomConfig: ZoomConfig = {
    min: CANVAS_CONSTANTS.ZOOM.MIN,
    max: CANVAS_CONSTANTS.ZOOM.MAX,
    step: CANVAS_CONSTANTS.ZOOM.STEP,
  };

  /**
   * Handles canvas panning during mouse move
   */
  static handlePanning(
    canvas: fabric.Canvas,
    deltaX: number,
    deltaY: number
  ): void {
    const vpt = canvas.viewportTransform;
    if (vpt) {
      vpt[4] += deltaX;
      vpt[5] += deltaY;
      canvas.requestRenderAll();

      // Update coordinates for all objects to fix selection areas after panning
      canvas.getObjects().forEach((obj) => {
        obj.setCoords();
      });
    }
  }

  /**
   * Handles canvas zoom with mouse wheel
   */
  static handleCanvasZoom(
    canvas: fabric.Canvas,
    options: fabric.IEvent & { e: WheelEvent }
  ): void {
    const delta = -options.e?.deltaY;
    let zoom = canvas.getZoom();

    // Calculate zoom based on mouse scroll wheel with min and max zoom
    zoom = Math.min(
      Math.max(
        ViewportManager.zoomConfig.min,
        zoom + delta * CANVAS_CONSTANTS.ZOOM.WHEEL_STEP
      ),
      ViewportManager.zoomConfig.max
    );

    // Set zoom to canvas
    canvas.zoomToPoint({ x: options.e.offsetX, y: options.e.offsetY }, zoom);

    options.e.preventDefault();
    options.e.stopPropagation();
  }

  /**
   * Manual zoom in function
   */
  static handleZoomIn(canvas: fabric.Canvas): void {
    const currentZoom = canvas.getZoom();
    const newZoom = Math.min(
      currentZoom + ViewportManager.zoomConfig.step,
      ViewportManager.zoomConfig.max
    );

    const center = canvas.getCenter();
    canvas.zoomToPoint({ x: center.left, y: center.top }, newZoom);
  }

  /**
   * Manual zoom out function
   */
  static handleZoomOut(canvas: fabric.Canvas): void {
    const currentZoom = canvas.getZoom();
    const newZoom = Math.max(
      currentZoom - ViewportManager.zoomConfig.step,
      ViewportManager.zoomConfig.min
    );

    const center = canvas.getCenter();
    canvas.zoomToPoint({ x: center.left, y: center.top }, newZoom);
  }

  /**
   * Reset zoom to 100%
   */
  static handleZoomReset(canvas: fabric.Canvas): void {
    const center = canvas.getCenter();
    canvas.zoomToPoint(
      { x: center.left, y: center.top },
      CANVAS_CONSTANTS.ZOOM.DEFAULT
    );
  }

  /**
   * Handles canvas resize
   */
  static handleResize(canvas: fabric.Canvas | null): void {
    if (!canvas) return;

    const canvasHTMLElement = canvas.getElement();
    if (!canvasHTMLElement) return;

    const canvasContainer = document.getElementById("canvas");
    if (!canvasContainer) return;

    const canvasWrapper = canvasContainer.querySelector(
      "div.relative"
    ) as HTMLElement;
    if (!canvasWrapper) return;

    // Set canvas dimensions to match the wrapper container dimensions
    canvas.setDimensions({
      width: canvasWrapper.clientWidth,
      height: canvasWrapper.clientHeight,
    });

    // Ensure the HTML canvas element matches these dimensions
    canvasHTMLElement.style.width = "100%";
    canvasHTMLElement.style.height = "100%";

    // Re-render the canvas after resize
    canvas.renderAll();
  }
}
