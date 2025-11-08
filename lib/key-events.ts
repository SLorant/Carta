import { fabric } from "fabric";
import { v4 as uuidv4 } from "uuid";

import { CustomFabricObject } from "@/types/type";

export const handleCopy = (canvas: fabric.Canvas) => {
  const activeObjects = canvas.getActiveObjects();
  if (activeObjects.length > 0) {
    // Serialize the selected objects with all properties
    const serializedObjects = activeObjects.map((obj) => {
      // Use toObject with additional properties to ensure all data is captured
      const objData = obj.toObject([
        "objectId",
        "storageId",
        "zIndex",
        "premadeName",
        "selectable",
        "evented",
        "perPixelTargetFind",
      ]);

      // Ensure we preserve all custom properties from loaded objects
      const customObj = obj as CustomFabricObject & {
        storageId?: string;
        zIndex?: number;
        premadeName?: string;
      };

      // Always set objectId (required for all objects)
      if (customObj.objectId) {
        objData.objectId = customObj.objectId;
      }

      // Preserve other custom properties if they exist
      if (customObj.storageId) {
        objData.storageId = customObj.storageId;
      }

      if (customObj.zIndex !== undefined) {
        objData.zIndex = customObj.zIndex;
      }

      if (customObj.premadeName) {
        objData.premadeName = customObj.premadeName;
      }

      return objData;
    });

    // Store the serialized objects in the clipboard
    try {
      localStorage.setItem("clipboard", JSON.stringify(serializedObjects));
      console.log(`Copied ${activeObjects.length} object(s) to clipboard`);
    } catch (error) {
      console.error("Failed to copy objects to clipboard:", error);
    }
  }

  return activeObjects;
};

export const handlePaste = (
  canvas: fabric.Canvas,
  syncShapeInStorage: (shape: fabric.Object) => void
) => {
  if (!canvas || !(canvas instanceof fabric.Canvas)) {
    console.error("Invalid canvas object. Aborting paste operation.");
    return;
  }

  // Retrieve serialized objects from the clipboard
  const clipboardData = localStorage.getItem("clipboard");

  if (!clipboardData) {
    console.log("No objects in clipboard to paste");
    return;
  }

  try {
    const parsedObjects = JSON.parse(clipboardData);
    if (!Array.isArray(parsedObjects) || parsedObjects.length === 0) {
      console.log("No valid objects in clipboard");
      return;
    }

    // Clear current selection before pasting
    canvas.discardActiveObject();

    const pastedObjects: fabric.Object[] = [];

    // Process all objects synchronously to avoid async issues
    const pastedObjectsData: Record<string, unknown>[] = [];

    // First, prepare all the object data with new IDs
    parsedObjects.forEach((objData: Record<string, unknown>) => {
      const newObjectData = { ...objData };

      // Generate new unique ID for the pasted object
      const newObjectId = uuidv4();
      newObjectData.objectId = newObjectId;

      // Remove storageId to prevent conflicts
      delete newObjectData.storageId;

      // Offset position
      const offsetX = 20;
      const offsetY = 20;
      if (typeof newObjectData.left === "number") {
        newObjectData.left = newObjectData.left + offsetX;
      }
      if (typeof newObjectData.top === "number") {
        newObjectData.top = newObjectData.top + offsetY;
      }

      pastedObjectsData.push(newObjectData);
    });

    // Now enliven all objects at once
    fabric.util.enlivenObjects(
      pastedObjectsData,
      (enlivenedObjects: fabric.Object[]) => {
        enlivenedObjects.forEach((enlivenedObj) => {
          // Ensure object is properly configured
          enlivenedObj.set({
            selectable: true,
            evented: true,
          });

          // Add to canvas
          canvas.add(enlivenedObj);
          pastedObjects.push(enlivenedObj);

          // Sync to storage after adding to canvas
          syncShapeInStorage(enlivenedObj);
        });

        // Select the pasted objects
        if (pastedObjects.length > 0) {
          setTimeout(() => {
            if (pastedObjects.length === 1) {
              canvas.setActiveObject(pastedObjects[0]);
            } else {
              const selection = new fabric.ActiveSelection(pastedObjects, {
                canvas: canvas,
              });
              canvas.setActiveObject(selection);
            }
            canvas.renderAll();
            console.log(
              `Successfully pasted ${pastedObjects.length} object(s)`
            );
          }, 10);
        }
      },
      "fabric"
    );
  } catch (error) {
    console.error("Error parsing clipboard data:", error);
  }
};

export const handleDelete = (
  canvas: fabric.Canvas,
  deleteShapeFromStorage: (id: string) => void
) => {
  const activeObjects = canvas.getActiveObjects();

  if (!activeObjects || activeObjects.length === 0) return;

  if (activeObjects.length > 0) {
    activeObjects.forEach((obj: CustomFabricObject) => {
      if (!obj.objectId) return;
      canvas.remove(obj);

      // For color layer objects, use storageId; for others, use objectId
      const storageId = (obj as CustomFabricObject & { storageId?: string })
        .storageId;
      const deleteId = storageId || obj.objectId;
      deleteShapeFromStorage(deleteId);
    });
  }

  canvas.discardActiveObject();
  canvas.requestRenderAll();
};

// create a handleKeyDown function that listen to different keydown events
export const handleKeyDown = ({
  e,
  canvas,
  undo,
  redo,
  syncShapeInStorage,
  deleteShapeFromStorage,
}: {
  e: KeyboardEvent;
  canvas: fabric.Canvas;
  undo: () => void;
  redo: () => void;
  syncShapeInStorage: (shape: fabric.Object) => void;
  deleteShapeFromStorage: (id: string) => void;
}) => {
  // Check if the target is an input field to avoid interfering with text editing
  const target = e.target as HTMLElement;
  const isInputField =
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable;

  // Skip keyboard shortcuts if user is typing in an input field
  if (isInputField) {
    return;
  }

  // Check if the key pressed is ctrl/cmd + c (copy)
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
    e.preventDefault();
    handleCopy(canvas);
  }

  // Check if the key pressed is ctrl/cmd + v (paste)
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
    e.preventDefault();
    handlePaste(canvas, syncShapeInStorage);
  }

  // check if the key pressed is ctrl/cmd + x (cut)
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "x") {
    e.preventDefault();
    handleCopy(canvas);
    handleDelete(canvas, deleteShapeFromStorage);
  }

  // check if the key pressed is ctrl/cmd + z (undo)
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
    e.preventDefault();
    undo();
  }

  // check if the key pressed is ctrl/cmd + y (redo) or ctrl/cmd + shift + z
  if (
    (e.ctrlKey || e.metaKey) &&
    (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))
  ) {
    e.preventDefault();
    redo();
  }

  // Prevent "/" key from triggering browser search
  if (e.key === "/" && !e.shiftKey) {
    e.preventDefault();
  }
};
