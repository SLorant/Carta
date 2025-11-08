import { fabric } from "fabric";
import { FabricObjectWithId } from "../types/canvas.types";
import { ZIndexManager } from "../managers/ZIndexManager";
import { ColorLayerManager } from "../managers/ColorLayerManager";
import { CANVAS_CONSTANTS } from "../constants/canvas.constants";

export class CanvasRenderer {
  private static isRendering = false;

  /**
   * Renders canvas objects from storage onto the canvas
   */
  static renderCanvas({
    fabricRef,
    canvasObjects,
    activeObjectRef,
  }: {
    fabricRef: React.MutableRefObject<fabric.Canvas | null>;
    canvasObjects: unknown;
    activeObjectRef: React.MutableRefObject<fabric.Object | null>;
  }): void {
    if (!fabricRef.current || CanvasRenderer.isRendering) {
      return;
    }

    CanvasRenderer.isRendering = true;

    try {
      CanvasRenderer.syncCanvasWithStorage(
        fabricRef.current,
        canvasObjects,
        activeObjectRef
      );
      ZIndexManager.reorderObjectsByZIndex(fabricRef.current);
      fabricRef.current.renderAll();
    } finally {
      CanvasRenderer.isRendering = false;
    }
  }

  /**
   * Synchronizes canvas objects with storage
   */
  private static syncCanvasWithStorage(
    canvas: fabric.Canvas,
    canvasObjects: unknown,
    activeObjectRef: React.MutableRefObject<fabric.Object | null>
  ): void {
    const currentObjects = canvas.getObjects();
    const storageObjectIds = new Set(
      Array.from(canvasObjects as unknown as Map<string, unknown>).map(
        ([id]) => id
      )
    );

    // Remove objects that are no longer in storage
    CanvasRenderer.removeObsoleteObjects(
      canvas,
      currentObjects,
      storageObjectIds
    );

    // Add/update objects from storage
    CanvasRenderer.addOrUpdateObjects(
      canvas,
      canvasObjects,
      currentObjects,
      activeObjectRef
    );
  }

  /**
   * Removes objects that no longer exist in storage
   */
  private static removeObsoleteObjects(
    canvas: fabric.Canvas,
    currentObjects: fabric.Object[],
    storageObjectIds: Set<string>
  ): void {
    const objectsToRemove = currentObjects.filter((obj) => {
      const objWithIds = obj as FabricObjectWithId;
      const idToCheck =
        objWithIds.objectId === CANVAS_CONSTANTS.COLORS.LAYER_OBJECT_ID
          ? objWithIds.storageId
          : objWithIds.objectId;
      return idToCheck && !storageObjectIds.has(idToCheck);
    });

    objectsToRemove.forEach((obj) => {
      canvas.remove(obj);
    });
  }

  /**
   * Adds or updates objects from storage
   */
  private static addOrUpdateObjects(
    canvas: fabric.Canvas,
    canvasObjects: unknown,
    currentObjects: fabric.Object[],
    activeObjectRef: React.MutableRefObject<fabric.Object | null>
  ): void {
    const objectEntries = Array.from(
      canvasObjects as unknown as Map<
        string,
        fabric.Object & { zIndex?: number }
      >
    );

    const sortedCanvasObjects = objectEntries.sort((a, b) => {
      const [, objectDataA] = a;
      const [, objectDataB] = b;
      const aZIndex = objectDataA?.zIndex ?? 0;
      const bZIndex = objectDataB?.zIndex ?? 0;
      return aZIndex - bZIndex;
    });

    sortedCanvasObjects.forEach((entry) => {
      const [storageId, objectData] = entry;
      CanvasRenderer.processStorageObject(
        canvas,
        storageId,
        objectData,
        currentObjects,
        activeObjectRef
      );
    });
  }

  /**
   * Processes a single object from storage
   */
  private static processStorageObject(
    canvas: fabric.Canvas,
    storageId: string,
    objectData: fabric.Object & { zIndex?: number },
    currentObjects: fabric.Object[],
    activeObjectRef: React.MutableRefObject<fabric.Object | null>
  ): void {
    const storedObjectId = (objectData as unknown as Record<string, unknown>)
      .objectId as string;
    const existingObject = CanvasRenderer.findExistingObject(
      currentObjects,
      storageId,
      storedObjectId
    );

    if (existingObject) {
      CanvasRenderer.updateExistingObject(
        existingObject,
        objectData,
        activeObjectRef,
        canvas
      );
    } else {
      CanvasRenderer.createNewObject(
        canvas,
        storageId,
        objectData,
        activeObjectRef
      );
    }
  }

  /**
   * Finds an existing object on the canvas
   */
  private static findExistingObject(
    currentObjects: fabric.Object[],
    storageId: string,
    storedObjectId: string
  ): fabric.Object | undefined {
    return currentObjects.find((obj) => {
      const objWithIds = obj as FabricObjectWithId;

      if (storedObjectId === CANVAS_CONSTANTS.COLORS.LAYER_OBJECT_ID) {
        return objWithIds.storageId === storageId;
      } else {
        return objWithIds.objectId === storageId;
      }
    });
  }

  /**
   * Updates an existing object with data from storage
   */
  private static updateExistingObject(
    existingObject: fabric.Object,
    objectData: fabric.Object & { zIndex?: number },
    activeObjectRef: React.MutableRefObject<fabric.Object | null>,
    canvas: fabric.Canvas
  ): void {
    const objectId = (existingObject as FabricObjectWithId).objectId;
    const isActiveObject = canvas.getActiveObject() === existingObject;
    const isCurrentUserActiveObject =
      (activeObjectRef.current as FabricObjectWithId)?.objectId === objectId;

    if (!isActiveObject || !isCurrentUserActiveObject) {
      CanvasRenderer.applyObjectUpdates(existingObject, objectData);
    }

    CanvasRenderer.maintainActiveSelection(
      existingObject,
      objectId,
      activeObjectRef,
      canvas
    );
  }

  /**
   * Applies updates to an existing object
   */
  private static applyObjectUpdates(
    existingObject: fabric.Object,
    objectData: fabric.Object & { zIndex?: number }
  ): void {
    const updatedData = { ...objectData } as Record<string, unknown>;
    delete updatedData.objectId;
    delete updatedData.storageId;
    delete updatedData.zIndex;
    delete updatedData.premadeName;

    const wasEvented = existingObject.evented;
    existingObject.evented = false;
    existingObject.set(updatedData);
    existingObject.evented = wasEvented;

    // Update special properties
    const objWithId = existingObject as FabricObjectWithId;
    const storedData = objectData as unknown as Record<string, unknown>;

    if (storedData.zIndex !== undefined) {
      objWithId.zIndex = storedData.zIndex as number;
    }

    if (storedData.premadeName !== undefined) {
      objWithId.premadeName = storedData.premadeName as string;
    }

    existingObject.setCoords();
  }

  /**
   * Maintains active selection state
   */
  private static maintainActiveSelection(
    existingObject: fabric.Object,
    objectId: string | undefined,
    activeObjectRef: React.MutableRefObject<fabric.Object | null>,
    canvas: fabric.Canvas
  ): void {
    if (
      (activeObjectRef.current as FabricObjectWithId)?.objectId === objectId &&
      canvas.getActiveObject() !== existingObject
    ) {
      canvas.setActiveObject(existingObject);
    }
  }

  /**
   * Creates a new object from storage data
   */
  private static createNewObject(
    canvas: fabric.Canvas,
    storageId: string,
    objectData: fabric.Object & { zIndex?: number },
    activeObjectRef: React.MutableRefObject<fabric.Object | null>
  ): void {
    fabric.util.enlivenObjects(
      [objectData],
      (enlivenedObjects: fabric.Object[]) => {
        enlivenedObjects.forEach((enlivenedObj) => {
          CanvasRenderer.configureNewObject(
            enlivenedObj,
            storageId,
            objectData,
            activeObjectRef,
            canvas
          );
          canvas.add(enlivenedObj);
        });
      },
      "fabric"
    );
  }

  /**
   * Configures a newly created object
   */
  private static configureNewObject(
    enlivenedObj: fabric.Object,
    storageId: string,
    objectData: fabric.Object & { zIndex?: number },
    activeObjectRef: React.MutableRefObject<fabric.Object | null>,
    canvas: fabric.Canvas
  ): void {
    const objWithId = enlivenedObj as FabricObjectWithId;
    objWithId.storageId = storageId;

    const actualObjectId = objWithId.objectId;
    const storedData = objectData as unknown as Record<string, unknown>;

    // Apply special properties to color layer objects
    if (actualObjectId === CANVAS_CONSTANTS.COLORS.LAYER_OBJECT_ID) {
      ColorLayerManager.configureColorLayerProperties(enlivenedObj);
    }

    // Set active object if needed
    if (
      (activeObjectRef.current as FabricObjectWithId)?.objectId ===
        actualObjectId &&
      actualObjectId !== CANVAS_CONSTANTS.COLORS.LAYER_OBJECT_ID
    ) {
      canvas.setActiveObject(enlivenedObj);
    }

    // Restore z-index and premade name
    CanvasRenderer.restoreObjectProperties(
      objWithId,
      storedData,
      actualObjectId,
      canvas
    );
  }

  /**
   * Restores object properties from storage
   */
  private static restoreObjectProperties(
    objWithId: FabricObjectWithId,
    storedData: Record<string, unknown>,
    actualObjectId: string | undefined,
    canvas: fabric.Canvas
  ): void {
    // Restore zIndex
    if (storedData.zIndex !== undefined) {
      if (actualObjectId === CANVAS_CONSTANTS.COLORS.LAYER_OBJECT_ID) {
        const zIndex = storedData.zIndex as number;
        objWithId.zIndex =
          zIndex < 0 ? zIndex : CANVAS_CONSTANTS.COLORS.BASE_Z_INDEX + zIndex;
      } else {
        objWithId.zIndex = storedData.zIndex as number;
      }
    } else {
      // Assign z-index based on current position if not in storage
      const currentIndex = canvas.getObjects().length ?? 0;
      if (actualObjectId === CANVAS_CONSTANTS.COLORS.LAYER_OBJECT_ID) {
        objWithId.zIndex = CANVAS_CONSTANTS.COLORS.BASE_Z_INDEX + currentIndex;
      } else {
        objWithId.zIndex = currentIndex;
      }
    }

    // Restore premadeName
    if (storedData.premadeName !== undefined) {
      objWithId.premadeName = storedData.premadeName as string;
    }
  }
}
