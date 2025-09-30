import { fabric } from "fabric";
import { v4 as uuid4 } from "uuid";

import {
  CanvasMouseDown,
  CanvasMouseMove,
  CanvasMouseUp,
  CanvasObjectModified,
  CanvasObjectScaling,
  CanvasPathCreated,
  CanvasSelectionCreated,
  RenderCanvas,
} from "@/types/type";
import { createSpecificShape } from "./shapes";

// Configure free drawing brush with advanced settings for continent-like drawing
export const configureFreeDrawingBrush = (
  canvas: fabric.Canvas,
  settings: {
    width: number;
    color: string;
    texture: string;
    roughness: number;
  }
) => {
  const brush = canvas.freeDrawingBrush;

  // Set basic brush properties
  brush.width = settings.width;
  brush.color = settings.color;

  // Configure texture and roughness based on settings
  switch (settings.texture) {
    case "smooth":
      brush.decimate = 5; // Less decimation for smoother lines
      break;
    case "rough":
      brush.decimate = 15; // More decimation for rougher lines
      break;
    case "textured":
      brush.decimate = 10; // Medium decimation
      break;
    case "continental":
      brush.decimate = Math.floor(20 + (settings.roughness / 100) * 30); // Variable decimation based on roughness
      // Create a custom pattern brush for continental effect
      createContinentalBrush(canvas, settings);
      break;
    default:
      brush.decimate = 10;
  }
};

// Create a special continental-style brush that creates organic, coastline-like strokes
const createContinentalBrush = (
  canvas: fabric.Canvas,
  settings: { width: number; color: string; roughness: number }
) => {
  // For continental effect, we'll use the pencil brush with organic variations
  const brush = canvas.freeDrawingBrush;

  // Add some organic variation to the drawing based on roughness
  const baseDecimate = 15;
  const roughnessVariation = (settings.roughness / 100) * 20;
  brush.decimate = Math.floor(baseDecimate + roughnessVariation);

  // Vary the width slightly for more organic feel
  if (settings.roughness > 50) {
    brush.width =
      settings.width + Math.random() * (settings.roughness / 100) * 5;
  }
};

// initialize fabric canvas
export const initializeFabric = ({
  fabricRef,
  canvasRef,
}: {
  fabricRef: React.MutableRefObject<fabric.Canvas | null>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}) => {
  // get canvas element from ref
  const canvasElement = canvasRef.current;

  if (!canvasElement) {
    console.error("Canvas element not found in ref");
    throw new Error("Canvas element not found");
  }

  // create fabric canvas
  const canvas = new fabric.Canvas(canvasElement, {
    width: canvasElement.clientWidth || 800,
    height: canvasElement.clientHeight || 600,
    backgroundColor: "#224477",
    fireMiddleClick: true,
  });

  // set canvas reference to fabricRef so we can use it later anywhere outside canvas listener
  fabricRef.current = canvas;

  return canvas;
};

// instantiate creation of custom fabric object/shape and add it to canvas
export const handleCanvasMouseDown = ({
  options,
  canvas,
  selectedShapeRef,
  isDrawing,
  shapeRef,
  activeObjectRef,
  isPanning,
  lastPanPoint,
  brushSettings,
}: CanvasMouseDown) => {
  const evt = options.e as MouseEvent;

  // Handle panning with middle mouse button
  if (evt.button === 1) {
    isPanning.current = true;
    lastPanPoint.current = { x: evt.clientX, y: evt.clientY };
    evt.preventDefault();
    evt.stopPropagation();
    // Change cursor to indicate panning mode
    const canvasElement = canvas.getElement();
    if (canvasElement) {
      canvasElement.style.cursor = "grab";
    }
    return;
  }

  // get pointer coordinates
  const pointer = canvas.getPointer(options.e);

  /**
   * get target object i.e., the object that is clicked
   * findtarget() returns the object that is clicked
   *
   * findTarget: http://fabricjs.com/docs/fabric.Canvas.html#findTarget
   */
  const target = canvas.findTarget(options.e, false);

  // set canvas drawing mode to false
  canvas.isDrawingMode = false;
  console.log(selectedShapeRef, canvas);

  // if selected shape is freeform, set drawing mode to true and return
  if (selectedShapeRef.current === "freeform") {
    isDrawing.current = true;
    canvas.isDrawingMode = true;

    // Configure brush based on settings received as parameters
    const defaultBrushSettings = {
      width: 20,
      color: "#ffffff",
      texture: "continental",
      roughness: 75,
    };

    configureFreeDrawingBrush(canvas, brushSettings || defaultBrushSettings);
    return;
  }

  canvas.isDrawingMode = false;

  // if target exists (any existing object), prioritize selection over creation
  if (target) {
    isDrawing.current = false;

    // set active object to target
    canvas.setActiveObject(target);

    // Also set the activeObjectRef to maintain the selection reference
    activeObjectRef.current = target;

    // Exit creation mode when selecting an existing object
    selectedShapeRef.current = null;

    /**
     * setCoords() is used to update the controls of the object
     * setCoords: http://fabricjs.com/docs/fabric.Object.html#setCoords
     */
    target.setCoords();
  } else if (
    selectedShapeRef.current &&
    selectedShapeRef.current !== "select"
  ) {
    // Only create shapes if a shape tool is selected (not in selection mode)
    isDrawing.current = true;

    // create custom fabric object/shape and set it to shapeRef
    shapeRef.current = createSpecificShape(
      selectedShapeRef.current,
      pointer as PointerEvent
    );

    // if shapeRef is not null, add it to canvas
    if (shapeRef.current) {
      // add: http://fabricjs.com/docs/fabric.Canvas.html#add
      canvas.add(shapeRef.current);

      // Assign z-index based on current canvas position
      const objects = canvas.getObjects();
      const newIndex = objects.length - 1;
      (shapeRef.current as fabric.Object & { zIndex: number }).zIndex =
        newIndex;
    }
  } else {
    // In selection mode, clicking on empty area should clear selection
    isDrawing.current = false;
    canvas.discardActiveObject();
    activeObjectRef.current = null;
    canvas.renderAll();
  }
};

// handle mouse move event on canvas to draw shapes with different dimensions
export const handleCanvaseMouseMove = ({
  options,
  canvas,
  isDrawing,
  selectedShapeRef,
  shapeRef,
  syncShapeInStorage,
  isPanning,
  lastPanPoint,
}: CanvasMouseMove) => {
  const evt = options.e as MouseEvent;

  // Handle panning if middle mouse button is held down
  if (isPanning.current && lastPanPoint.current) {
    const deltaX = evt.clientX - lastPanPoint.current.x;
    const deltaY = evt.clientY - lastPanPoint.current.y;

    // Get current viewport transform
    const vpt = canvas.viewportTransform;
    if (vpt) {
      // Update the viewport transform to pan the canvas
      vpt[4] += deltaX;
      vpt[5] += deltaY;
      canvas.requestRenderAll();

      // Update coordinates for all objects to fix selection areas after panning
      canvas.getObjects().forEach((obj) => {
        obj.setCoords();
      });
    }

    // Update last pan point
    lastPanPoint.current = { x: evt.clientX, y: evt.clientY };
    evt.preventDefault();
    evt.stopPropagation();
    return;
  }

  // if selected shape is freeform, return
  if (!isDrawing.current) return;
  if (selectedShapeRef.current === "freeform") return;

  canvas.isDrawingMode = false;

  // get pointer coordinates
  const pointer = canvas.getPointer(options.e);

  // depending on the selected shape, set the dimensions of the shape stored in shapeRef in previous step of handelCanvasMouseDown
  // calculate shape dimensions based on pointer coordinates
  switch (selectedShapeRef?.current) {
    case "rectangle":
      shapeRef.current?.set({
        width: pointer.x - (shapeRef.current?.left || 0),
        height: pointer.y - (shapeRef.current?.top || 0),
      });
      break;

    case "circle":
      shapeRef.current.set({
        radius: Math.abs(pointer.x - (shapeRef.current?.left || 0)) / 2,
      });
      break;

    case "triangle":
      shapeRef.current?.set({
        width: pointer.x - (shapeRef.current?.left || 0),
        height: pointer.y - (shapeRef.current?.top || 0),
      });
      break;

    case "line":
      shapeRef.current?.set({
        x2: pointer.x,
        y2: pointer.y,
      });
      break;

    case "image":
      shapeRef.current?.set({
        width: pointer.x - (shapeRef.current?.left || 0),
        height: pointer.y - (shapeRef.current?.top || 0),
      });

    default:
      break;
  }

  // render objects on canvas
  // renderAll: http://fabricjs.com/docs/fabric.Canvas.html#renderAll
  canvas.renderAll();

  // sync shape in storage
  if (shapeRef.current?.objectId) {
    syncShapeInStorage(shapeRef.current);
  }
};

// handle mouse up event on canvas to stop drawing shapes
export const handleCanvasMouseUp = ({
  isDrawing,
  shapeRef,
  selectedShapeRef,
  syncShapeInStorage,
  isPanning,
  lastPanPoint,
  options,
  canvas,
}: CanvasMouseUp) => {
  const evt = options.e as MouseEvent;

  // Handle panning end for middle mouse button
  if (evt.button === 1) {
    isPanning.current = false;
    lastPanPoint.current = null;
    // Reset cursor
    const canvasElement = canvas.getElement();
    if (canvasElement) {
      canvasElement.style.cursor = "default";
    }
    evt.preventDefault();
    evt.stopPropagation();
    return;
  }

  isDrawing.current = false;
  if (selectedShapeRef.current === "freeform") return;

  // sync shape in storage as drawing is stopped
  syncShapeInStorage(shapeRef.current);

  // Only clear shapeRef if we were actually drawing a new shape
  if (shapeRef.current) {
    // We were creating a new shape, so clear the shape reference
    // but keep the tool active for continuous creation
    shapeRef.current = null;
  } else {
    // We were just interacting with existing objects, only clear shapeRef
    shapeRef.current = null;
  }
};

// update shape in storage when object is modified
export const handleCanvasObjectModified = ({
  options,
  syncShapeInStorage,
}: CanvasObjectModified) => {
  const target = options.target;
  if (!target) return;

  if (target?.type == "activeSelection") {
    // fix this
  } else {
    syncShapeInStorage(target);
  }
};

// update shape in storage when path is created when in freeform mode
export const handlePathCreated = ({
  options,
  syncShapeInStorage,
}: CanvasPathCreated) => {
  // get path object
  const path = options.path;
  if (!path) return;

  // set unique id to path object
  path.set({
    objectId: uuid4(),
  });

  // sync shape in storage
  syncShapeInStorage(path);
};

// check how object is moving on canvas and restrict it to canvas boundaries
export const handleCanvasObjectMoving = ({
  options,
}: {
  options: fabric.IEvent;
}) => {
  // get target object which is moving
  const target = options.target as fabric.Object;

  // target.canvas is the canvas on which the object is moving
  const canvas = target.canvas as fabric.Canvas;

  // set coordinates of target object
  target.setCoords();

  // restrict object to canvas boundaries (horizontal)
  if (target && target.left) {
    target.left = Math.max(
      0,
      Math.min(
        target.left,
        (canvas.width || 0) - (target.getScaledWidth() || target.width || 0)
      )
    );
  }

  // restrict object to canvas boundaries (vertical)
  if (target && target.top) {
    target.top = Math.max(
      0,
      Math.min(
        target.top,
        (canvas.height || 0) - (target.getScaledHeight() || target.height || 0)
      )
    );
  }
};

// set element attributes when element is selected
export const handleCanvasSelectionCreated = ({
  options,
  isEditingRef,
  setElementAttributes,
  setActiveElement,
  selectedShapeRef,
}: CanvasSelectionCreated) => {
  // Reset editing state when a new selection is made
  isEditingRef.current = false;

  // if no element is selected, return
  if (!options?.selected) return;

  console.log(selectedShapeRef);

  // Switch to select tool when an object is selected
  // TODO make this work
  /*   selectedShapeRef.current = null;
  setActiveElement({
    icon: "/assets/select.svg",
    name: "Select",
    value: "select",
  }); */

  // get the selected element
  const selectedElement = options?.selected[0] as fabric.Object & {
    fontSize: string;
    fontFamily: string;
    fontWeight: string;
  };

  console.log(selectedElement);

  // if only one element is selected, set element attributes
  if (selectedElement && options.selected.length === 1) {
    // calculate scaled dimensions of the object
    const scaledWidth = selectedElement?.scaleX
      ? (selectedElement?.width ?? 0) * selectedElement?.scaleX
      : selectedElement?.width;

    const scaledHeight = selectedElement?.scaleY
      ? (selectedElement?.height ?? 0) * selectedElement?.scaleY
      : selectedElement?.height;

    setElementAttributes({
      width: scaledWidth?.toFixed(0).toString() || "",
      height: scaledHeight?.toFixed(0).toString() || "",
      fill: selectedElement?.fill?.toString() || "",
      stroke: selectedElement?.stroke || "",
      fontSize: selectedElement?.fontSize || "",
      fontFamily: selectedElement?.fontFamily || "",
      fontWeight: selectedElement?.fontWeight || "",
      opacity: selectedElement?.opacity?.toString() || "1",
      brushWidth: "20",
      brushColor: "#ffffff",
      brushTexture: "continental",
      brushRoughness: "75",
    });
  }
};

// handle when selection is updated (changing from one object to another)
export const handleCanvasSelectionUpdated = ({
  options,
  isEditingRef,
  setElementAttributes,
  setActiveElement,
  selectedShapeRef,
}: CanvasSelectionCreated) => {
  selectedShapeRef.current = null;
  setActiveElement({
    icon: "/assets/select.svg",
    name: "Select",
    value: "select",
  });

  handleCanvasSelectionCreated({
    options,
    isEditingRef,
    setElementAttributes,
    setActiveElement,
    selectedShapeRef,
  });
};

// update element attributes when element is scaled
export const handleCanvasObjectScaling = ({
  options,
  setElementAttributes,
}: CanvasObjectScaling) => {
  const selectedElement = options.target;

  // calculate scaled dimensions of the object
  const scaledWidth = selectedElement?.scaleX
    ? (selectedElement?.width ?? 0) * selectedElement?.scaleX
    : selectedElement?.width;

  const scaledHeight = selectedElement?.scaleY
    ? (selectedElement?.height ?? 0) * selectedElement?.scaleY
    : selectedElement?.height;

  setElementAttributes((prev) => ({
    ...prev,
    width: scaledWidth?.toFixed(0).toString() || "",
    height: scaledHeight?.toFixed(0).toString() || "",
  }));
};

// render canvas objects coming from storage on canvas
export const renderCanvas = ({
  fabricRef,
  canvasObjects,
  activeObjectRef,
}: RenderCanvas) => {
  console.log(
    "renderCanvas called, canvasObjects size:",
    (canvasObjects as Map<string, unknown>)?.size
  );

  // Safety check: ensure canvas is initialized
  if (!fabricRef.current) {
    console.log("Canvas not initialized yet, skipping render");
    return;
  }

  // Store the current background color before clearing
  const backgroundColor = fabricRef.current.backgroundColor;

  // clear canvas
  fabricRef.current.clear();

  // Restore the background color after clearing (fallback to #333 if undefined)
  fabricRef.current.setBackgroundColor(
    backgroundColor || "#333",
    fabricRef.current.renderAll.bind(fabricRef.current)
  );

  // render all objects on canvas in proper z-index order
  const objectEntries = Array.from(
    canvasObjects as Map<string, fabric.Object & { zIndex?: number }>
  );

  console.log(canvasObjects);

  console.log(
    "renderCanvas - objectEntries before sort:",
    objectEntries.map(([id, obj]) => ({ id, zIndex: obj.zIndex }))
  );

  const sortedCanvasObjects = objectEntries.sort((a, b) => {
    const [, objectDataA] = a;
    const [, objectDataB] = b;
    const aZIndex = objectDataA?.zIndex ?? 0;
    const bZIndex = objectDataB?.zIndex ?? 0;
    return aZIndex - bZIndex; // Sort by z-index (bottom to top)
  });

  console.log(
    "renderCanvas - sortedCanvasObjects after sort:",
    sortedCanvasObjects.map(([id, obj]) => ({ id, zIndex: obj.zIndex }))
  );

  sortedCanvasObjects.forEach((entry) => {
    const [objectId, objectData] = entry;
    /**
     * enlivenObjects() is used to render objects on canvas.
     * It takes two arguments:
     * 1. objectData: object data to render on canvas
     * 2. callback: callback function to execute after rendering objects
     * on canvas
     *
     * enlivenObjects: http://fabricjs.com/docs/fabric.util.html#.enlivenObjectEnlivables
     */
    fabric.util.enlivenObjects(
      [objectData],
      (enlivenedObjects: fabric.Object[]) => {
        enlivenedObjects.forEach((enlivenedObj) => {
          // if element is active, keep it in active state so that it can be edited further
          if (activeObjectRef.current?.objectId === objectId) {
            fabricRef.current?.setActiveObject(enlivenedObj);
          }

          // Restore zIndex from storage if it exists
          const storedZIndex = (
            objectData as unknown as Record<string, unknown>
          ).zIndex as number | undefined;
          if (storedZIndex !== undefined) {
            (enlivenedObj as fabric.Object & { zIndex: number }).zIndex =
              storedZIndex;
          } else {
            // Assign z-index based on the current position if not in storage
            const currentIndex = fabricRef.current?.getObjects().length ?? 0;
            (enlivenedObj as fabric.Object & { zIndex: number }).zIndex =
              currentIndex;
          }

          // add object to canvas
          fabricRef.current?.add(enlivenedObj);
        });
      },
      /**
       * specify namespace of the object for fabric to render it on canvas
       * A namespace is a string that is used to identify the type of
       * object.
       *
       * Fabric Namespace: http://fabricjs.com/docs/fabric.html
       */
      "fabric"
    );
  });

  fabricRef.current?.renderAll();
};

// resize canvas dimensions on window resize
export const handleResize = ({ canvas }: { canvas: fabric.Canvas | null }) => {
  const canvasElement = document.getElementById("canvas");
  if (!canvasElement) return;

  if (!canvas) return;

  canvas.setDimensions({
    width: canvasElement.clientWidth,
    height: canvasElement.clientHeight,
  });
};

// zoom canvas on mouse scroll
export const handleCanvasZoom = ({
  options,
  canvas,
}: {
  options: fabric.IEvent & { e: WheelEvent };
  canvas: fabric.Canvas;
}) => {
  const delta = -options.e?.deltaY;
  let zoom = canvas.getZoom();

  // allow zooming to min 20% and max 100%
  const minZoom = 0.2;
  const maxZoom = 10;
  const zoomStep = 0.001;

  // calculate zoom based on mouse scroll wheel with min and max zoom
  zoom = Math.min(Math.max(minZoom, zoom + delta * zoomStep), maxZoom);

  // set zoom to canvas
  // zoomToPoint: http://fabricjs.com/docs/fabric.Canvas.html#zoomToPoint
  canvas.zoomToPoint({ x: options.e.offsetX, y: options.e.offsetY }, zoom);

  options.e.preventDefault();
  options.e.stopPropagation();
};

// Update brush settings when they change
export const updateBrushSettings = (
  canvas: fabric.Canvas,
  settings: {
    width: number;
    color: string;
    texture: string;
    roughness: number;
  }
) => {
  if (canvas.isDrawingMode) {
    configureFreeDrawingBrush(canvas, settings);
  }
};
