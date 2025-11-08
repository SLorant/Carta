import { fabric } from "fabric";
import { CanvasConfig } from "../types/canvas.types";
import { CANVAS_CONSTANTS } from "../constants/canvas.constants";

export class CanvasInitializer {
  /**
   * Initializes the fabric canvas with configuration
   */
  static initializeFabric({
    fabricRef,
    canvasRef,
  }: {
    fabricRef: React.MutableRefObject<fabric.Canvas | null>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
  }): fabric.Canvas {
    const canvasElement = canvasRef.current;

    if (!canvasElement) {
      console.error("Canvas element not found in ref");
      throw new Error("Canvas element not found");
    }

    const config: CanvasConfig = {
      width: canvasElement.clientWidth || 800,
      height: canvasElement.clientHeight || 600,
      fireMiddleClick: true,
      preserveObjectStacking: true,
    };

    const canvas = new fabric.Canvas(canvasElement, config);

    CanvasInitializer.configureBackground(canvas);
    fabricRef.current = canvas;

    return canvas;
  }

  /**
   * Configures the canvas background
   */
  private static configureBackground(canvas: fabric.Canvas): void {
    const canvasHTMLElement = canvas.getElement();
    if (canvasHTMLElement) {
      canvasHTMLElement.style.backgroundImage = `url('${CANVAS_CONSTANTS.BACKGROUND.TEXTURE_URL}')`;
      canvasHTMLElement.style.backgroundSize = "cover";
      canvasHTMLElement.style.backgroundPosition = "center";
      canvasHTMLElement.style.backgroundRepeat = "no-repeat";
    }
  }
}
