// Compatibility layer that maintains the original API while using the new architecture
import { fabric } from "fabric";
import { CanvasInitializer } from "./core/CanvasInitializer";
import { CanvasRenderer } from "./core/CanvasRenderer";
import { MouseEventHandler } from "./handlers/MouseEventHandler";
import { CanvasEventHandler } from "./handlers/CanvasEventHandler";
import { ViewportManager } from "./managers/ViewportManager";
import { BrushManager } from "./managers/BrushManager";
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

/**
 * Initialize fabric canvas - maintains original API
 */
export const initializeFabric = CanvasInitializer.initializeFabric;

/**
 * Handle mouse down events - maintains original API
 */
export const handleCanvasMouseDown = (params: CanvasMouseDown) => {
  MouseEventHandler.handleCanvasMouseDown(params);
};

/**
 * Handle mouse move events - maintains original API
 */
export const handleCanvaseMouseMove = (params: CanvasMouseMove) => {
  MouseEventHandler.handleCanvaseMouseMove(params);
};

/**
 * Handle mouse up events - maintains original API
 */
export const handleCanvasMouseUp = (params: CanvasMouseUp) => {
  MouseEventHandler.handleCanvasMouseUp(params);
};

/**
 * Handle object modification - maintains original API
 */
export const handleCanvasObjectModified = (params: CanvasObjectModified) => {
  CanvasEventHandler.handleCanvasObjectModified(params);
};

/**
 * Handle object movement - maintains original API
 */
export const handleCanvasObjectMoving = (params: {
  options: fabric.IEvent;
}) => {
  CanvasEventHandler.handleCanvasObjectMoving(params);
};

/**
 * Handle object scaling - maintains original API
 */
export const handleCanvasObjectScaling = (params: CanvasObjectScaling) => {
  CanvasEventHandler.handleCanvasObjectScaling(params);
};

/**
 * Handle selection creation - maintains original API
 */
export const handleCanvasSelectionCreated = (
  params: CanvasSelectionCreated
) => {
  CanvasEventHandler.handleCanvasSelectionCreated(params);
};

/**
 * Handle selection update - maintains original API
 */
export const handleCanvasSelectionUpdated = (
  params: CanvasSelectionCreated
) => {
  CanvasEventHandler.handleCanvasSelectionUpdated(params);
};

/**
 * Handle path creation - maintains original API
 */
export const handlePathCreated = (
  params: CanvasPathCreated & {
    selectedShapeRef?: React.MutableRefObject<string | null>;
    elementAttributes?: { opacity?: string };
  }
) => {
  CanvasEventHandler.handlePathCreated(params);
};

/**
 * Handle canvas zoom - maintains original API
 */
export const handleCanvasZoom = (params: {
  options: fabric.IEvent & { e: WheelEvent };
  canvas: fabric.Canvas;
}) => {
  ViewportManager.handleCanvasZoom(params.canvas, params.options);
};

/**
 * Handle zoom in - maintains original API
 */
export const handleZoomIn = (canvas: fabric.Canvas) => {
  ViewportManager.handleZoomIn(canvas);
};

/**
 * Handle zoom out - maintains original API
 */
export const handleZoomOut = (canvas: fabric.Canvas) => {
  ViewportManager.handleZoomOut(canvas);
};

/**
 * Handle zoom reset - maintains original API
 */
export const handleZoomReset = (canvas: fabric.Canvas) => {
  ViewportManager.handleZoomReset(canvas);
};

/**
 * Handle resize - maintains original API
 */
export const handleResize = (params: { canvas: fabric.Canvas | null }) => {
  ViewportManager.handleResize(params.canvas);
};

/**
 * Render canvas - maintains original API
 */
export const renderCanvas = (params: RenderCanvas) => {
  CanvasRenderer.renderCanvas(params);
};

/**
 * Configure free drawing brush - maintains original API
 */
export const configureFreeDrawingBrush = (
  canvas: fabric.Canvas,
  settings: BrushSettings
) => {
  BrushManager.configureFreeDrawingBrush(canvas, settings);
};

/**
 * Update brush settings - maintains original API
 */
export const updateBrushSettings = (
  canvas: fabric.Canvas,
  settings: BrushSettings
) => {
  BrushManager.updateBrushSettings(canvas, settings);
};
