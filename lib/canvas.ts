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
import { defaultNavElement } from "@/constants";
import { createSpecificShape } from "./shapes";

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

  console.log("Creating fabric canvas with element:", canvasElement);
  console.log(
    "Canvas dimensions:",
    canvasElement.clientWidth,
    "x",
    canvasElement.clientHeight
  );

  // create fabric canvas
  const canvas = new fabric.Canvas(canvasElement, {
    width: canvasElement.clientWidth || 800,
    height: canvasElement.clientHeight || 600,
    backgroundColor: "#333",
  });

  console.log("Fabric canvas created successfully");

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
}: CanvasMouseDown) => {
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
    canvas.freeDrawingBrush.width = 5;
    return;
  }

  canvas.isDrawingMode = false;

  // if target is the selected shape or active selection, set isDrawing to false
  if (
    target &&
    (target.type === selectedShapeRef.current ||
      target.type === "activeSelection" ||
      selectedShapeRef.current === null) // Allow selection even when no shape tool is active
  ) {
    isDrawing.current = false;

    // set active object to target
    canvas.setActiveObject(target);

    // Also set the activeObjectRef to maintain the selection reference
    activeObjectRef.current = target;

    /**
     * setCoords() is used to update the controls of the object
     * setCoords: http://fabricjs.com/docs/fabric.Object.html#setCoords
     */
    target.setCoords();
  } else {
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
}: CanvasMouseMove) => {
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
  canvas,
  isDrawing,
  shapeRef,
  activeObjectRef,
  selectedShapeRef,
  syncShapeInStorage,
  setActiveElement,
}: CanvasMouseUp) => {
  isDrawing.current = false;
  if (selectedShapeRef.current === "freeform") return;

  // sync shape in storage as drawing is stopped
  syncShapeInStorage(shapeRef.current);

  // Only clear activeObjectRef and selectedShapeRef if we were actually drawing a new shape
  // If we were just moving/selecting an existing object, keep the selection
  if (shapeRef.current) {
    // We were creating a new shape, so clear everything
    shapeRef.current = null;
    activeObjectRef.current = null;
    selectedShapeRef.current = null;

    // if canvas is not in drawing mode, set active element to default nav element after 700ms
    if (!canvas.isDrawingMode) {
      setTimeout(() => {
        setActiveElement(defaultNavElement);
      }, 700);
    }
  } else {
    // We were just interacting with existing objects, only clear shapeRef and selectedShapeRef
    shapeRef.current = null;
    selectedShapeRef.current = null;
    // Keep activeObjectRef.current so the selection remains visible
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
}: CanvasSelectionCreated) => {
  // Reset editing state when a new selection is made
  isEditingRef.current = false;

  // if no element is selected, return
  if (!options?.selected) return;

  // get the selected element
  const selectedElement = options?.selected[0] as fabric.Object & {
    fontSize: string;
    fontFamily: string;
    fontWeight: string;
  };

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
    });
  }
};

// handle when selection is updated (changing from one object to another)
export const handleCanvasSelectionUpdated = ({
  options,
  isEditingRef,
  setElementAttributes,
}: CanvasSelectionCreated) => {
  handleCanvasSelectionCreated({ options, isEditingRef, setElementAttributes });
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
          const storedZIndex = (objectData as unknown as Record<string, unknown>).zIndex as number | undefined;
          if (storedZIndex !== undefined) {
            (enlivenedObj as fabric.Object & { zIndex: number }).zIndex = storedZIndex;
          } else {
            // Assign z-index based on the current position if not in storage
            const currentIndex = fabricRef.current?.getObjects().length ?? 0;
            (enlivenedObj as fabric.Object & { zIndex: number }).zIndex = currentIndex;
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
  const delta = options.e?.deltaY;
  let zoom = canvas.getZoom();

  // allow zooming to min 20% and max 100%
  const minZoom = 0.2;
  const maxZoom = 1;
  const zoomStep = 0.001;

  // calculate zoom based on mouse scroll wheel with min and max zoom
  zoom = Math.min(Math.max(minZoom, zoom + delta * zoomStep), maxZoom);

  // set zoom to canvas
  // zoomToPoint: http://fabricjs.com/docs/fabric.Canvas.html#zoomToPoint
  canvas.zoomToPoint({ x: options.e.offsetX, y: options.e.offsetY }, zoom);

  options.e.preventDefault();
  options.e.stopPropagation();
};
