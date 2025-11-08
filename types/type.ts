import { Gradient, Pattern } from "fabric/fabric-impl";

export enum CursorMode {
  Hidden,
  Chat,
  ReactionSelector,
  Reaction,
}

export type CursorState =
  | {
      mode: CursorMode.Hidden;
    }
  | {
      mode: CursorMode.Chat;
      message: string;
      previousMessage: string | null;
    }
  | {
      mode: CursorMode.ReactionSelector;
    }
  | {
      mode: CursorMode.Reaction;
      reaction: string;
      isPressed: boolean;
    };

export type Reaction = {
  value: string;
  timestamp: number;
  point: { x: number; y: number };
};

export type ReactionEvent = {
  x: number;
  y: number;
  value: string;
};

export type ShapeData = {
  type: string;
  width: number;
  height: number;
  fill: string | Pattern | Gradient;
  left: number;
  top: number;
  objectId: string | undefined;
};

export type Attributes = {
  width: string;
  height: string;
  fontSize: string;
  fontFamily: string;
  fontWeight: string;
  fill: string;
  stroke: string;
  opacity: string;
  brushWidth: string;
  brushColor: string;
};

export type ActiveElement = {
  name: string;
  value: string;
  icon: string;
} | null;

export interface CustomFabricObject extends fabric.Object {
  objectId?: string;
}

export type ModifyShape = {
  canvas: fabric.Canvas;
  property: string;
  value: string;
  activeObjectRef: React.MutableRefObject<fabric.Object | null>;
  syncShapeInStorage: (shape: fabric.Object) => void;
};

export type ElementDirection = {
  canvas: fabric.Canvas;
  direction: string;
  syncShapeInStorage: (shape: fabric.Object) => void;
};

export type ImageUpload = {
  file: File;
  canvas: React.MutableRefObject<fabric.Canvas | null>;
  shapeRef: React.MutableRefObject<fabric.Object | null>;
  syncShapeInStorage: (shape: fabric.Object) => void;
};

export type PremadeShapeUpload = {
  shapeSrc: string;
  canvas: React.MutableRefObject<fabric.Canvas | null>;
  shapeRef: React.MutableRefObject<fabric.Object | null>;
  syncShapeInStorage: (shape: fabric.Object) => void;
};

export type RightSidebarProps = {
  allShapes: Array<fabric.Object>;
  elementAttributes: Attributes;
  setElementAttributes: React.Dispatch<React.SetStateAction<Attributes>>;
  fabricRef: React.MutableRefObject<fabric.Canvas | null>;
  activeObjectRef: React.MutableRefObject<fabric.Object | null>;
  isEditingRef: React.MutableRefObject<boolean>;
  syncShapeInStorage: (obj: fabric.Object) => void;
  selectedShapeRef: React.MutableRefObject<string | null>;
};

export type NavbarProps = {
  activeElement: ActiveElement;
  imageInputRef: React.MutableRefObject<HTMLInputElement | null>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleActiveElement: (element: ActiveElement) => void;
  handleZoomIn?: () => void;
  handleZoomOut?: () => void;
  handleZoomReset?: () => void;
  fabricRef: React.MutableRefObject<fabric.Canvas | null>;
};

export type ShapesMenuProps = {
  item: {
    name: string;
    icon: string;
    value: Array<ActiveElement>;
  };
  activeElement: ActiveElement;
  handleActiveElement: (element: ActiveElement) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  imageInputRef: React.MutableRefObject<HTMLInputElement | null>;
};

export type CanvasMouseDown = {
  options: fabric.IEvent;
  canvas: fabric.Canvas;
  selectedShapeRef: React.MutableRefObject<string | null>;
  isDrawing: React.MutableRefObject<boolean>;
  shapeRef: React.MutableRefObject<fabric.Object | null>;
  activeObjectRef: React.MutableRefObject<fabric.Object | null>;
  isPanning: React.MutableRefObject<boolean>;
  lastPanPoint: React.MutableRefObject<{ x: number; y: number } | null>;
  syncShapeInStorage: (shape: fabric.Object) => void;
  setActiveElement?: (element: ActiveElement) => void;
  brushSettings?: {
    width: number;
    color: string;
    opacity?: number;
  };
};

export type CanvasMouseMove = {
  options: fabric.IEvent;
  canvas: fabric.Canvas;
  isDrawing: React.MutableRefObject<boolean>;
  selectedShapeRef: React.MutableRefObject<string | null>;
  shapeRef: React.MutableRefObject<fabric.Object | null>;
  isPanning: React.MutableRefObject<boolean>;
  lastPanPoint: React.MutableRefObject<{ x: number; y: number } | null>;
};

export type CanvasMouseUp = {
  isDrawing: React.MutableRefObject<boolean>;
  shapeRef: React.MutableRefObject<fabric.Object | null>;
  selectedShapeRef: React.MutableRefObject<string | null>;
  syncShapeInStorage: (shape: fabric.Object) => void;
  isPanning: React.MutableRefObject<boolean>;
  lastPanPoint: React.MutableRefObject<{ x: number; y: number } | null>;
  options: fabric.IEvent;
  canvas: fabric.Canvas;
};

export type CanvasObjectModified = {
  options: fabric.IEvent;
};

export type CanvasPathCreated = {
  options: fabric.IEvent & { path: CustomFabricObject };
  syncShapeInStorage: (shape: fabric.Object) => void;
};

export type CanvasSelectionCreated = {
  options: fabric.IEvent;
  isEditingRef: React.MutableRefObject<boolean>;
  setElementAttributes: React.Dispatch<React.SetStateAction<Attributes>>;
  setActiveElement: React.Dispatch<React.SetStateAction<ActiveElement>>;
  selectedShapeRef: React.MutableRefObject<string | null>;
};

export type CanvasObjectScaling = {
  options: fabric.IEvent;
  setElementAttributes: React.Dispatch<React.SetStateAction<Attributes>>;
};

export type RenderCanvas = {
  fabricRef: React.MutableRefObject<fabric.Canvas | null>;
  canvasObjects: Array<fabric.Object>;
  activeObjectRef: React.MutableRefObject<fabric.Object | null>;
};

export type CursorChatProps = {
  cursor: { x: number; y: number };
  cursorState: CursorState;
  setCursorState: (cursorState: CursorState) => void;
  updateMyPresence: (
    presence: Partial<{
      cursor: { x: number; y: number };
      cursorColor: string;
      message: string;
    }>
  ) => void;
};
