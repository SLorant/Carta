import { fabric } from "fabric";
import { v4 as uuidv4 } from "uuid";

import { CustomFabricObject } from "@/types/type";

export const handleCopy = (canvas: fabric.Canvas) => {
  const activeObjects = canvas.getActiveObjects();
  if (activeObjects.length > 0) {
    // Serialize the selected objects with all custom properties
    const serializedObjects = activeObjects.map((obj) => {
      const objData = obj.toObject();
      // Preserve custom properties
      if ((obj as CustomFabricObject).objectId) {
        objData.objectId = (obj as CustomFabricObject).objectId;
      }
      if ((obj as CustomFabricObject & { storageId?: string }).storageId) {
        objData.storageId = (obj as CustomFabricObject & { storageId?: string }).storageId;
      }
      if ((obj as CustomFabricObject & { zIndex?: number }).zIndex !== undefined) {
        objData.zIndex = (obj as CustomFabricObject & { zIndex?: number }).zIndex;
      }
      if ((obj as CustomFabricObject & { premadeName?: string }).premadeName) {
        objData.premadeName = (obj as CustomFabricObject & { premadeName?: string }).premadeName;
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

    parsedObjects.forEach((objData: Record<string, unknown>) => {
      // convert the plain javascript objects retrieved from localStorage into fabricjs objects (deserialization)
      fabric.util.enlivenObjects(
        [objData],
        (enlivenedObjects: fabric.Object[]) => {
          enlivenedObjects.forEach((enlivenedObj) => {
            // Generate new ID for the pasted object
            const newObjectId = uuidv4();
            
            // Offset the pasted objects to avoid overlap with existing objects
            const offsetX = 20;
            const offsetY = 20;
            
            enlivenedObj.set({
              left: (enlivenedObj.left || 0) + offsetX,
              top: (enlivenedObj.top || 0) + offsetY,
              objectId: newObjectId,
            } as CustomFabricObject);

            // Preserve original fill color instead of overriding
            if (objData.fill && typeof objData.fill === "string" && objData.fill !== "#aabbcc") {
              enlivenedObj.set("fill", objData.fill);
            }

            // Preserve other custom properties but with new IDs
            if (objData.premadeName && typeof objData.premadeName === "string") {
              (enlivenedObj as CustomFabricObject & { premadeName?: string }).premadeName = objData.premadeName;
            }

            canvas.add(enlivenedObj);
            pastedObjects.push(enlivenedObj);
            syncShapeInStorage(enlivenedObj);
          });

          // Select the pasted objects if there are any
          if (pastedObjects.length > 0) {
            if (pastedObjects.length === 1) {
              canvas.setActiveObject(pastedObjects[0]);
            } else {
              const selection = new fabric.ActiveSelection(pastedObjects, {
                canvas: canvas,
              });
              canvas.setActiveObject(selection);
            }
          }

          canvas.renderAll();
          console.log(`Pasted ${pastedObjects.length} object(s)`);
        },
        "fabric"
      );
    });
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
  const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
  
  // Skip keyboard shortcuts if user is typing in an input field
  if (isInputField) {
    return;
  }

  // Check if the key pressed is ctrl/cmd + c (copy)
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
    e.preventDefault();
    handleCopy(canvas);
  }

  // Check if the key pressed is ctrl/cmd + v (paste)
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
    e.preventDefault();
    handlePaste(canvas, syncShapeInStorage);
  }

  // check if the key pressed is ctrl/cmd + x (cut)
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
    e.preventDefault();
    handleCopy(canvas);
    handleDelete(canvas, deleteShapeFromStorage);
  }

  // check if the key pressed is ctrl/cmd + z (undo)
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
    e.preventDefault();
    undo();
  }

  // check if the key pressed is ctrl/cmd + y (redo) or ctrl/cmd + shift + z
  if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
    e.preventDefault();
    redo();
  }

  // Prevent "/" key from triggering browser search
  if (e.key === '/' && !e.shiftKey) {
    e.preventDefault();
  }
};
