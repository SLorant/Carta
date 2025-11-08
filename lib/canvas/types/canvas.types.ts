import { fabric } from "fabric";

// Extended fabric objects with custom properties
export interface FabricObjectWithId extends fabric.Object {
  objectId?: string;
  storageId?: string;
  zIndex?: number;
  premadeName?: string;
}

export interface BrushSettings {
  width: number;
  color: string;
  opacity?: number;
}

export interface PanState {
  x: number;
  y: number;
}

export interface ZoomConfig {
  min: number;
  max: number;
  step: number;
}

export interface CanvasConfig {
  width: number;
  height: number;
  backgroundColor?: string;
  backgroundImage?: string;
  fireMiddleClick: boolean;
  preserveObjectStacking: boolean;
}

export interface ViewportTransform {
  panDelta: PanState;
  zoom: number;
  center: fabric.Point;
}
