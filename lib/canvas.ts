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
    opacity?: number;
  }
) => {
  const brush = canvas.freeDrawingBrush;

  // Convert color to RGBA if opacity is provided
  let brushColor = settings.color;
  if (settings.opacity !== undefined && settings.opacity < 1) {
    // Convert hex color to RGBA
    const hex = settings.color.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    brushColor = `rgba(${r}, ${g}, ${b}, ${settings.opacity})`;
  }

  // Set basic brush properties
  brush.width = settings.width;
  brush.color = brushColor;

  // Configure texture and roughness based on settings
  switch (settings.texture) {
    case "smooth":
      brush.decimate = 0; // Less decimation for smoother lines
      break;
    case "rough":
      brush.decimate = 0; // More decimation for rougher lines
      break;
    case "textured":
      brush.decimate = 0; // Medium decimation
      break;
    case "continental":
      brush.decimate = 0; // Medium decimation

      /*   brush.decimate = Math.floor(20 + (settings.roughness / 100) * 30); // Variable decimation based on roughness
      // Create a custom pattern brush for continental effect
      createContinentalBrush(canvas, settings); */
      break;
    default:
      brush.decimate = 0;
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

// Helper function to reorder all objects on canvas based on their z-index
const reorderObjectsByZIndex = (canvas: fabric.Canvas) => {
  const objects = canvas.getObjects();

  // Sort all objects by z-index
  objects.sort((a, b) => {
    const aZIndex = (a as fabric.Object & { zIndex?: number }).zIndex || 0;
    const bZIndex = (b as fabric.Object & { zIndex?: number }).zIndex || 0;
    return aZIndex - bZIndex;
  });

  // Reorder objects on canvas based on sorted z-index
  objects.forEach((obj, targetIndex) => {
    const currentIndex = canvas.getObjects().indexOf(obj);
    if (currentIndex !== targetIndex) {
      canvas.moveTo(obj, targetIndex);
    }
  });
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
    /*    backgroundColor: "#224477", */ // Fallback color while image loads
    fireMiddleClick: true,
    preserveObjectStacking: true, // Prevent objects from being brought to front when selected
  });

  // Set CSS background for fixed background that doesn't zoom
  const canvasHTMLElement = canvas.getElement();
  if (canvasHTMLElement) {
    canvasHTMLElement.style.backgroundImage = "url('/textures/sea.png')";
    canvasHTMLElement.style.backgroundSize = "cover";
    canvasHTMLElement.style.backgroundPosition = "center";
    canvasHTMLElement.style.backgroundRepeat = "no-repeat";
  }

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
  syncShapeInStorage,
  setActiveElement,
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
  let target = canvas.findTarget(options.e, false);

  // If the target is a color layer object, ignore it and find the next target
  if (
    target &&
    (target as fabric.Object & { objectId?: string }).objectId === "color-layer"
  ) {
    target = undefined;
  }

  // set canvas drawing mode to false
  canvas.isDrawingMode = false;

  // if selected shape is freeform or color, set drawing mode to true and return
  if (
    selectedShapeRef.current === "freeform" ||
    selectedShapeRef.current === "color"
  ) {
    isDrawing.current = true;
    canvas.isDrawingMode = true;

    // Configure the brush with current settings including opacity
    if (brushSettings) {
      configureFreeDrawingBrush(canvas, brushSettings);
    }

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
    selectedShapeRef.current.startsWith("premade:")
  ) {
    // Handle premade shapes - create new instance each time like regular shapes
    isDrawing.current = false;

    const premadeData = selectedShapeRef.current.replace("premade:", "");
    const [shapeSrc, shapeName] = premadeData.split(":");

    // Use the provided shape name or fall back to extracting from path
    const displayName =
      shapeName || shapeSrc.split("/").pop()?.split(".")[0] || "Image";

    // Create a new image instance for placement
    fabric.Image.fromURL(shapeSrc, (img) => {
      img.scaleToWidth(50);
      img.scaleToHeight(50);

      // Position the image at the clicked location
      img.set({
        left: pointer.x - (img.width! * img.scaleX!) / 2,
        top: pointer.y - (img.height! * img.scaleY!) / 2,
      });

      // Set objectId and premade shape name for the image
      (
        img as fabric.Image & { objectId?: string; premadeName?: string }
      ).objectId = uuid4();
      (
        img as fabric.Image & { objectId?: string; premadeName?: string }
      ).premadeName = displayName;

      // Add the image to canvas
      canvas.add(img);

      // Assign z-index based on current canvas position
      const objects = canvas.getObjects();
      const newIndex = objects.length - 1;
      (img as unknown as fabric.Object & { zIndex: number }).zIndex = newIndex;

      // Reorder objects to maintain proper z-index layering
      reorderObjectsByZIndex(canvas);

      // Sync to storage and render
      syncShapeInStorage(img);
      canvas.renderAll();
    });

    // Keep selectedShapeRef set for multiple placements (don't clear it)
  } else if (shapeRef.current && shapeRef.current.type === "image") {
    // Handle placement of prepared images (from upload or premade shapes)
    isDrawing.current = false;

    // Position the image at the clicked location
    shapeRef.current.set({
      left:
        pointer.x - (shapeRef.current.width! * shapeRef.current.scaleX!) / 2,
      top:
        pointer.y - (shapeRef.current.height! * shapeRef.current.scaleY!) / 2,
    });

    // Add the image to canvas
    canvas.add(shapeRef.current);

    // Assign z-index based on current canvas position
    const objects = canvas.getObjects();
    const newIndex = objects.length - 1;
    (shapeRef.current as fabric.Object & { zIndex: number }).zIndex = newIndex;

    // Reorder objects to maintain proper z-index layering
    reorderObjectsByZIndex(canvas);

    // Now sync to storage and render
    syncShapeInStorage(shapeRef.current);
    canvas.renderAll();

    // Clear the shapeRef to exit placement mode
    shapeRef.current = null;

    // Switch back to select mode after placing image
    selectedShapeRef.current = null;

    // Set active element back to select mode
    if (setActiveElement) {
      setActiveElement({
        icon: "/assets/select.svg",
        name: "Select",
        value: "select",
      });
    }
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

      // Reorder objects to maintain proper z-index layering
      reorderObjectsByZIndex(canvas);
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

  // if selected shape is freeform or color, return
  if (!isDrawing.current) return;
  if (
    selectedShapeRef.current === "freeform" ||
    selectedShapeRef.current === "color"
  )
    return;

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
  if (
    selectedShapeRef.current === "freeform" ||
    selectedShapeRef.current === "color"
  )
    return;

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
  selectedShapeRef,
  elementAttributes,
}: CanvasPathCreated & {
  selectedShapeRef?: React.MutableRefObject<string | null>;
  elementAttributes?: { opacity?: string };
}) => {
  // get path object
  const path = options.path;
  if (!path) return;

  // Check if we're in color mode
  if (selectedShapeRef?.current === "color") {
    // For color tool, we want to merge all drawing into one shape
    const canvas = path.canvas;
    if (!canvas) return;

    // Apply opacity to the new path before adding it
    if (elementAttributes?.opacity) {
      path.set({
        opacity: parseFloat(elementAttributes.opacity),
      });
    }

    // Make the new path completely non-interactive
    path.set({
      selectable: false,
      evented: false,
      hoverCursor: "default",
      moveCursor: "default",
      excludeFromExport: false,
      hasControls: false,
      hasBorders: false,
      lockMovementX: true,
      lockMovementY: true,
      lockRotation: true,
      lockScalingX: true,
      lockScalingY: true,
      lockUniScaling: true,
    });

    // Set the objectId on the new path (shared by all color paths)
    (path as fabric.Object & { objectId?: string }).objectId = "color-layer";

    // Set a unique storage ID for this specific path instance
    (path as fabric.Object & { storageId?: string }).storageId = uuid4();

    // Path is already added to canvas automatically by fabric.js, no need to add it again

    // Get existing color paths to maintain proper layering among color objects
    const existingColorPaths = canvas
      .getObjects()
      .filter(
        (obj: fabric.Object) =>
          (obj as fabric.Object & { objectId?: string }).objectId ===
          "color-layer"
      );

    // Find the highest z-index among existing color paths
    let colorZIndex = -1000; // Start with base low z-index for first color stroke
    if (existingColorPaths.length > 1) {
      // More than just the current path - find the max z-index among existing color paths
      const maxColorZIndex = Math.max(
        ...existingColorPaths
          .filter((obj: fabric.Object) => obj !== path) // Exclude the current path
          .map(
            (obj: fabric.Object) =>
              (obj as fabric.Object & { zIndex: number }).zIndex || -1000
          )
      );
      colorZIndex = maxColorZIndex + 1; // Place new stroke above previous color strokes
    }

    // Set the z-index for the new path
    (path as fabric.Object & { zIndex: number }).zIndex = colorZIndex;

    // Reorder objects to ensure proper layering based on z-index
    reorderObjectsByZIndex(canvas);

    canvas.renderAll();

    // sync the individual path in storage
    syncShapeInStorage(path);

    return;
  }

  // Normal freeform behavior
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

  // Check if the selected object is a color layer path - if so, deselect it
  const selectedObj = options?.selected[0] as fabric.Object & {
    objectId?: string;
  };
  if (selectedObj && selectedObj.objectId === "color-layer") {
    // Deselect the color layer object
    const canvas = selectedObj.canvas as fabric.Canvas;
    if (canvas) {
      canvas.discardActiveObject();
      canvas.renderAll();
    }
    return;
  }

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
  // Safety check: ensure canvas is initialized
  if (!fabricRef.current) {
    console.log("Canvas not initialized yet, skipping render");
    return;
  }

  // Get current objects on canvas
  const currentObjects = fabricRef.current.getObjects();

  // Get objects from storage
  const storageObjectIds = new Set(
    Array.from(canvasObjects as Map<string, unknown>).map(([id]) => id)
  );

  // Find objects to remove (exist on canvas but not in storage)
  const objectsToRemove = currentObjects.filter((obj) => {
    const objWithIds = obj as fabric.Object & {
      objectId?: string;
      storageId?: string;
    };
    // For color layers, check by storageId; for regular objects, check by objectId
    const idToCheck =
      objWithIds.objectId === "color-layer"
        ? objWithIds.storageId
        : objWithIds.objectId;
    return idToCheck && !storageObjectIds.has(idToCheck);
  });

  // Remove objects that are no longer in storage
  objectsToRemove.forEach((obj) => {
    fabricRef.current?.remove(obj);
  });

  // Find objects to add/update (exist in storage but not on canvas or need updating)
  const objectEntries = Array.from(
    canvasObjects as Map<string, fabric.Object & { zIndex?: number }>
  );

  const sortedCanvasObjects = objectEntries.sort((a, b) => {
    const [, objectDataA] = a;
    const [, objectDataB] = b;
    const aZIndex = objectDataA?.zIndex ?? 0;
    const bZIndex = objectDataB?.zIndex ?? 0;
    return aZIndex - bZIndex; // Sort by z-index (bottom to top)
  });

  sortedCanvasObjects.forEach((entry) => {
    const [storageId, objectData] = entry;

    // Get the objectId from the stored object data
    const storedObjectId = (objectData as unknown as Record<string, unknown>)
      .objectId as string;

    // For color layer paths, we need to check by storage ID, not objectId
    // because multiple paths can have the same objectId ("color-layer")
    // For regular objects, check by objectId
    const existingObject = currentObjects.find((obj) => {
      const objWithIds = obj as fabric.Object & {
        objectId?: string;
        storageId?: string;
      };

      if (storedObjectId === "color-layer") {
        // For color layers, match by storageId
        return objWithIds.storageId === storageId;
      } else {
        // For regular objects, match by objectId
        return objWithIds.objectId === storageId;
      }
    });

    if (existingObject) {
      // Object exists, just update its properties if needed
      // For now, we'll skip updating to avoid flashing - objects are updated via other mechanisms
      const objectId = (existingObject as fabric.Object & { objectId?: string })
        .objectId;
      if (
        activeObjectRef.current?.objectId === objectId &&
        fabricRef.current?.getActiveObject() !== existingObject
      ) {
        fabricRef.current?.setActiveObject(existingObject);
      }
      return;
    }

    // Object doesn't exist on canvas, create it
    fabric.util.enlivenObjects(
      [objectData],
      (enlivenedObjects: fabric.Object[]) => {
        enlivenedObjects.forEach((enlivenedObj) => {
          // Set the storage ID so we can track this specific object instance
          (enlivenedObj as fabric.Object & { storageId?: string }).storageId =
            storageId;

          // Get the actual objectId from the object data
          const actualObjectId = (
            enlivenedObj as fabric.Object & { objectId?: string }
          ).objectId;

          // Apply special properties to color layer objects
          if (actualObjectId === "color-layer") {
            enlivenedObj.set({
              selectable: false,
              evented: false,
              hoverCursor: "default",
              moveCursor: "default",
              excludeFromExport: false,
              hasControls: false,
              hasBorders: false,
              lockMovementX: true,
              lockMovementY: true,
              lockRotation: true,
              lockScalingX: true,
              lockScalingY: true,
              lockUniScaling: true,
            });
          }

          // if element is active, keep it in active state so that it can be edited further
          if (
            activeObjectRef.current?.objectId === actualObjectId &&
            actualObjectId !== "color-layer"
          ) {
            fabricRef.current?.setActiveObject(enlivenedObj);
          }

          // Restore zIndex from storage if it exists, but ensure color layers stay negative
          const storedZIndex = (
            objectData as unknown as Record<string, unknown>
          ).zIndex as number | undefined;
          if (storedZIndex !== undefined) {
            if (actualObjectId === "color-layer") {
              // Ensure color layers always have negative z-index
              (enlivenedObj as fabric.Object & { zIndex: number }).zIndex =
                storedZIndex < 0 ? storedZIndex : -1000 + storedZIndex;
            } else {
              (enlivenedObj as fabric.Object & { zIndex: number }).zIndex =
                storedZIndex;
            }
          } else {
            // Assign z-index based on the current position if not in storage
            const currentIndex = fabricRef.current?.getObjects().length ?? 0;
            if (actualObjectId === "color-layer") {
              // Color layers get negative z-index
              (enlivenedObj as fabric.Object & { zIndex: number }).zIndex =
                -1000 + currentIndex;
            } else {
              // Regular objects get positive z-index
              (enlivenedObj as fabric.Object & { zIndex: number }).zIndex =
                currentIndex;
            }
          }

          // Restore premadeName from storage if it exists
          const storedPremadeName = (
            objectData as unknown as Record<string, unknown>
          ).premadeName as string | undefined;
          if (storedPremadeName !== undefined) {
            (
              enlivenedObj as fabric.Object & { premadeName: string }
            ).premadeName = storedPremadeName;
          }

          // add object to canvas
          fabricRef.current?.add(enlivenedObj);
        });
      },
      "fabric"
    );
  });

  // Reorder all objects based on their z-index after rendering
  if (fabricRef.current) {
    reorderObjectsByZIndex(fabricRef.current);
  }

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

// Manual zoom in function
export const handleZoomIn = (canvas: fabric.Canvas) => {
  const currentZoom = canvas.getZoom();
  const maxZoom = 10;
  const zoomStep = 0.1;

  const newZoom = Math.min(currentZoom + zoomStep, maxZoom);

  // Zoom to center of canvas
  const center = canvas.getCenter();
  canvas.zoomToPoint({ x: center.left, y: center.top }, newZoom);
};

// Manual zoom out function
export const handleZoomOut = (canvas: fabric.Canvas) => {
  const currentZoom = canvas.getZoom();
  const minZoom = 0.2;
  const zoomStep = 0.1;

  const newZoom = Math.max(currentZoom - zoomStep, minZoom);

  // Zoom to center of canvas
  const center = canvas.getCenter();
  canvas.zoomToPoint({ x: center.left, y: center.top }, newZoom);
};

// Reset zoom to 100%
export const handleZoomReset = (canvas: fabric.Canvas) => {
  const center = canvas.getCenter();
  canvas.zoomToPoint({ x: center.left, y: center.top }, 1);
};

// Update brush settings when they change
export const updateBrushSettings = (
  canvas: fabric.Canvas,
  settings: {
    width: number;
    color: string;
    texture: string;
    roughness: number;
    opacity?: number;
  }
) => {
  if (canvas.isDrawingMode) {
    configureFreeDrawingBrush(canvas, settings);
  }
};
