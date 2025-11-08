import { fabric } from "fabric";
import { BrushSettings } from "../types/canvas.types";

export class BrushManager {
  /**
   * Configures the free drawing brush with advanced settings
   */
  static configureFreeDrawingBrush(
    canvas: fabric.Canvas,
    settings: BrushSettings
  ): void {
    const brush = canvas.freeDrawingBrush;
    let brushColor = settings.color;

    // Convert color to RGBA if opacity is provided
    if (settings.opacity !== undefined && settings.opacity < 1) {
      const hex = settings.color.replace("#", "");
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      brushColor = `rgba(${r}, ${g}, ${b}, ${settings.opacity})`;
    }

    // Set brush properties
    brush.width = settings.width;
    brush.color = brushColor;
  }

  /**
   * Updates brush settings when they change
   */
  static updateBrushSettings(
    canvas: fabric.Canvas,
    settings: BrushSettings
  ): void {
    if (canvas.isDrawingMode) {
      BrushManager.configureFreeDrawingBrush(canvas, settings);
    }
  }
}
