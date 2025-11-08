// Main canvas exports - this will be the new canvas.ts file
export { CanvasInitializer } from "./core/CanvasInitializer";
export { CanvasRenderer } from "./core/CanvasRenderer";
export { MouseEventHandler } from "./handlers/MouseEventHandler";
export { CanvasEventHandler } from "./handlers/CanvasEventHandler";
export { ViewportManager } from "./managers/ViewportManager";
export { BrushManager } from "./managers/BrushManager";
export { ZIndexManager } from "./managers/ZIndexManager";
export { ColorLayerManager } from "./managers/ColorLayerManager";
export { PremadeShapeManager } from "./managers/PremadeShapeManager";

// Re-export types
export type {
  FabricObjectWithId,
  BrushSettings,
  PanState,
  ZoomConfig,
  CanvasConfig,
  ViewportTransform,
} from "./types/canvas.types";

// Re-export constants
export { CANVAS_CONSTANTS, CANVAS_EVENTS } from "./constants/canvas.constants";

// Main convenience functions that maintain the original API
import { CanvasInitializer } from "./core/CanvasInitializer";
import { CanvasRenderer } from "./core/CanvasRenderer";
import { MouseEventHandler } from "./handlers/MouseEventHandler";
import { CanvasEventHandler } from "./handlers/CanvasEventHandler";
import { ViewportManager } from "./managers/ViewportManager";
import { BrushManager } from "./managers/BrushManager";
import { fabric } from "fabric";
import { BrushSettings } from "./types/canvas.types";
import {
  CanvasMouseDown,
  CanvasMouseMove,
  CanvasMouseUp,
  CanvasObjectModified,
  CanvasObjectScaling,
  CanvasSelectionCreated,
  CanvasPathCreated,
  RenderCanvas,
} from "@/types/type";

// Export compatibility functions
export const initializeFabric = CanvasInitializer.initializeFabric;
export const renderCanvas = (params: RenderCanvas) =>
  CanvasRenderer.renderCanvas(params);
export const handleCanvasMouseDown = (params: CanvasMouseDown) =>
  MouseEventHandler.handleCanvasMouseDown(params);
export const handleCanvaseMouseMove = (params: CanvasMouseMove) =>
  MouseEventHandler.handleCanvaseMouseMove(params);
export const handleCanvasMouseUp = (params: CanvasMouseUp) =>
  MouseEventHandler.handleCanvasMouseUp(params);
export const handleCanvasObjectModified = (params: CanvasObjectModified) =>
  CanvasEventHandler.handleCanvasObjectModified(params);
export const handleCanvasObjectMoving = (params: { options: fabric.IEvent }) =>
  CanvasEventHandler.handleCanvasObjectMoving(params);
export const handleCanvasObjectScaling = (params: CanvasObjectScaling) =>
  CanvasEventHandler.handleCanvasObjectScaling(params);
export const handleCanvasSelectionCreated = (params: CanvasSelectionCreated) =>
  CanvasEventHandler.handleCanvasSelectionCreated(params);
export const handleCanvasSelectionUpdated = (params: CanvasSelectionCreated) =>
  CanvasEventHandler.handleCanvasSelectionUpdated(params);
export const handlePathCreated = (
  params: CanvasPathCreated & {
    selectedShapeRef?: React.MutableRefObject<string | null>;
    elementAttributes?: { opacity?: string };
  }
) => CanvasEventHandler.handlePathCreated(params);
export const handleCanvasZoom = (params: {
  options: fabric.IEvent & { e: WheelEvent };
  canvas: fabric.Canvas;
}) => ViewportManager.handleCanvasZoom(params.canvas, params.options);
export const handleZoomIn = (canvas: fabric.Canvas) =>
  ViewportManager.handleZoomIn(canvas);
export const handleZoomOut = (canvas: fabric.Canvas) =>
  ViewportManager.handleZoomOut(canvas);
export const handleZoomReset = (canvas: fabric.Canvas) =>
  ViewportManager.handleZoomReset(canvas);
export const handleResize = (params: { canvas: fabric.Canvas | null }) =>
  ViewportManager.handleResize(params.canvas);
export const configureFreeDrawingBrush = (
  canvas: fabric.Canvas,
  settings: BrushSettings
) => BrushManager.configureFreeDrawingBrush(canvas, settings);
export const updateBrushSettings = (
  canvas: fabric.Canvas,
  settings: BrushSettings
) => BrushManager.updateBrushSettings(canvas, settings);
