import { fabric } from "fabric";
import { ActiveElement, Attributes } from "@/types/type";

export interface CanvasRefs {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  fabricRef: React.MutableRefObject<fabric.Canvas | null>;
  isDrawing: React.MutableRefObject<boolean>;
  shapeRef: React.MutableRefObject<fabric.Object | null>;
  selectedShapeRef: React.MutableRefObject<string | null>;
  activeObjectRef: React.MutableRefObject<fabric.Object | null>;
  imageInputRef: React.RefObject<HTMLInputElement>;
  isEditingRef: React.MutableRefObject<boolean>;
  isPanning: React.MutableRefObject<boolean>;
  lastPanPoint: React.MutableRefObject<{ x: number; y: number } | null>;
}

export interface EditorState {
  elementAttributes: Attributes;
  setElementAttributes: React.Dispatch<React.SetStateAction<Attributes>>;
  activeElement: ActiveElement;
  setActiveElement: React.Dispatch<React.SetStateAction<ActiveElement>>;
  isPremadeShapesModalOpen: boolean;
  setIsPremadeShapesModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isCanvasInitialized: boolean;
  setIsCanvasInitialized: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface CanvasOperations {
  handleZoomInCanvas: () => void;
  handleZoomOutCanvas: () => void;
  handleZoomResetCanvas: () => void;
  deleteAllShapes: () => boolean;
  deleteShapeFromStorage: (objectId: string) => void;
  syncShapeInStorage: (object: fabric.Object) => void;
}

export interface PremadeShape {
  name: string;
  src: string;
}

export interface EditorHookProps {
  userName: string;
  undo: () => void;
  redo: () => void;
  canvasObjects: unknown;
}

export interface CanvasEventHandlers {
  onMouseDown: (options: fabric.IEvent) => void;
  onMouseUp: (options: fabric.IEvent) => void;
  onMouseMove: (options: fabric.IEvent) => void;
  onObjectModified: (options: fabric.IEvent) => void;
  onSelectionCreated: (options: fabric.IEvent) => void;
  onSelectionUpdated: (options: fabric.IEvent) => void;
  onSelectionCleared: (options: fabric.IEvent) => void;
  onObjectScaling: (options: fabric.IEvent) => void;
  onPathCreated: (options: fabric.IEvent) => void;
  onMouseWheel: (options: fabric.IEvent) => void;
}
