"use client";

import { useMemo, useState, useCallback } from "react";
import Image from "next/image";
import { fabric } from "fabric";

import { getShapeInfo } from "@/lib/utils";

interface LayersProps {
  allShapes: Array<[string, any]>;
  fabricRef: React.MutableRefObject<fabric.Canvas | null>;
  activeObjectRef: React.MutableRefObject<fabric.Object | null>;
  syncShapeInStorage: (shape: fabric.Object) => void;
}

// Helper function to safely access objectId property
const getObjectId = (obj: fabric.Object): string | undefined => {
  if (!obj) return undefined;
  return (obj as any).objectId;
};

const Layers = ({
  allShapes,
  fabricRef,
  activeObjectRef,
  syncShapeInStorage,
}: LayersProps) => {
  const [draggedLayer, setDraggedLayer] = useState<string | null>(null);
  const [dragOverLayer, setDragOverLayer] = useState<string | null>(null);

  // Create array of shapes with their z-index for proper ordering
  const orderedShapes = useMemo(() => {
    if (!fabricRef.current) return [];

    const canvas = fabricRef.current;
    const canvasObjects = canvas.getObjects();

    // Create a map of objectId to z-index based on canvas order
    const zIndexMap = new Map();
    canvasObjects.forEach((obj, index) => {
      const objectId = getObjectId(obj);
      if (objectId) {
        zIndexMap.set(objectId, index);
      }
    });

    console.log(zIndexMap);

    // Filter out individual color layer paths and create a single color layer entry
    const filteredShapes = allShapes.filter(([, shape]) => {
      return shape?.objectId !== "color-layer";
    });

    // Check if there are any color layer paths
    const colorLayerPaths = allShapes.filter(([, shape]) => {
      return shape?.objectId === "color-layer";
    });

    // If there are color layer paths, add a single "Color" entry
    if (colorLayerPaths.length > 0) {
      // Use the first color path as the representative, but modify its display info
      const colorLayerEntry: [string, any] = [
        "color-layer", // Use a consistent key
        {
          ...colorLayerPaths[0][1], // Copy properties from first path
          objectId: "color-layer",
          type: "color", // Set type to "color" for proper icon display
          name: "Color Layer",
        },
      ];
      filteredShapes.push(colorLayerEntry);
    }

    // Sort filtered shapes by their z-index (canvas order)
    return filteredShapes.slice().sort((a, b) => {
      const aIndex = zIndexMap.get(a[1]?.objectId) ?? -1;
      const bIndex = zIndexMap.get(b[1]?.objectId) ?? -1;
      return bIndex - aIndex; // Reverse order (top objects first in list)
    });
  }, [allShapes, fabricRef]);

  const handleDragStart = useCallback(
    (e: React.DragEvent, objectId: string) => {
      // Prevent dragging of color layer since it represents multiple objects
      if (objectId === "color-layer") {
        e.preventDefault();
        return;
      }

      setDraggedLayer(objectId);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", objectId);
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent, objectId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverLayer(objectId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverLayer(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetObjectId: string) => {
      e.preventDefault();
      setDragOverLayer(null);

      if (
        !draggedLayer ||
        !fabricRef.current ||
        draggedLayer === targetObjectId
      ) {
        setDraggedLayer(null);
        return;
      }

      const canvas = fabricRef.current;
      const draggedObject = canvas
        .getObjects()
        .find((obj) => getObjectId(obj) === draggedLayer);
      const targetObject = canvas
        .getObjects()
        .find((obj) => getObjectId(obj) === targetObjectId);

      if (!draggedObject || !targetObject) {
        setDraggedLayer(null);
        return;
      }

      // Get the current index of the target object
      const targetIndex = canvas.getObjects().indexOf(targetObject);

      // Move the dragged object to the target position
      canvas.moveTo(draggedObject, targetIndex);

      // Update z-index for all objects after reordering
      canvas.getObjects().forEach((obj, index) => {
        (obj as fabric.Object & { zIndex: number }).zIndex = index;
        // Sync each object to storage to persist the new z-index
        syncShapeInStorage(obj);
      });

      // Re-render the canvas
      canvas.renderAll();

      console.log(
        "After reorder - Canvas order:",
        canvas.getObjects().map((obj) => ({
          id: getObjectId(obj),
          zIndex: (obj as fabric.Object & { zIndex?: number }).zIndex,
        }))
      );

      setDraggedLayer(null);
    },
    [draggedLayer, fabricRef, syncShapeInStorage]
  );

  const handleLayerClick = useCallback(
    (objectId: string) => {
      if (!fabricRef.current) return;

      // Special handling for color layer - don't select since it's non-selectable
      if (objectId === "color-layer") {
        // Just clear any existing selection
        const canvas = fabricRef.current;
        canvas.discardActiveObject();
        activeObjectRef.current = null;
        canvas.renderAll();
        return;
      }

      const canvas = fabricRef.current;
      const targetObject = canvas
        .getObjects()
        .find((obj) => getObjectId(obj) === objectId);

      if (targetObject) {
        canvas.setActiveObject(targetObject);
        activeObjectRef.current = targetObject;
        canvas.renderAll();
      }
    },
    [fabricRef, activeObjectRef]
  );

  const handleLayerVisibilityToggle = useCallback(
    (objectId: string, e: React.MouseEvent) => {
      e.stopPropagation();

      if (!fabricRef.current) return;

      const canvas = fabricRef.current;

      // Special handling for color layer - toggle visibility of all color paths
      if (objectId === "color-layer") {
        const colorObjects = canvas
          .getObjects()
          .filter((obj) => getObjectId(obj) === "color-layer");

        if (colorObjects.length > 0) {
          // Use the first object's visibility state to determine the new state
          const newVisibility = !colorObjects[0].visible;

          colorObjects.forEach((obj) => {
            obj.set("visible", newVisibility);
            syncShapeInStorage(obj);
          });

          canvas.renderAll();
        }
        return;
      }

      const targetObject = canvas
        .getObjects()
        .find((obj) => getObjectId(obj) === objectId);

      if (targetObject) {
        targetObject.set("visible", !targetObject.visible);
        canvas.renderAll();
        syncShapeInStorage(targetObject);
      }
    },
    [fabricRef, syncShapeInStorage]
  );

  const handleMoveToFront = useCallback(
    (objectId: string, e: React.MouseEvent) => {
      e.stopPropagation();

      if (!fabricRef.current) return;

      const canvas = fabricRef.current;

      // Special handling for color layer - move all color paths
      if (objectId === "color-layer") {
        const colorObjects = canvas
          .getObjects()
          .filter((obj) => getObjectId(obj) === "color-layer");

        colorObjects.forEach((obj) => {
          canvas.bringToFront(obj);
        });

        // Update z-index for all objects after reordering
        canvas.getObjects().forEach((obj, index) => {
          (obj as fabric.Object & { zIndex: number }).zIndex = index;
          syncShapeInStorage(obj);
        });

        canvas.renderAll();
        return;
      }

      const targetObject = canvas
        .getObjects()
        .find((obj) => getObjectId(obj) === objectId);

      if (targetObject) {
        canvas.bringToFront(targetObject);

        // Update z-index for all objects after reordering
        canvas.getObjects().forEach((obj, index) => {
          (obj as fabric.Object & { zIndex: number }).zIndex = index;
          // Sync each object to storage to persist the new z-index
          syncShapeInStorage(obj);
        });

        canvas.renderAll();
      }
    },
    [fabricRef, syncShapeInStorage]
  );

  const handleMoveToBack = useCallback(
    (objectId: string, e: React.MouseEvent) => {
      e.stopPropagation();

      if (!fabricRef.current) return;

      const canvas = fabricRef.current;

      // Special handling for color layer - move all color paths to back
      if (objectId === "color-layer") {
        const colorObjects = canvas
          .getObjects()
          .filter((obj) => getObjectId(obj) === "color-layer");

        colorObjects.forEach((obj) => {
          canvas.sendToBack(obj);
        });

        // Update z-index for all objects after reordering
        canvas.getObjects().forEach((obj, index) => {
          (obj as fabric.Object & { zIndex: number }).zIndex = index;
          syncShapeInStorage(obj);
        });

        canvas.renderAll();
        return;
      }

      const targetObject = canvas
        .getObjects()
        .find((obj) => getObjectId(obj) === objectId);

      if (targetObject) {
        canvas.sendToBack(targetObject);

        // Update z-index for all objects after reordering
        canvas.getObjects().forEach((obj, index) => {
          (obj as fabric.Object & { zIndex: number }).zIndex = index;
          // Sync each object to storage to persist the new z-index
          syncShapeInStorage(obj);
        });

        canvas.renderAll();
      }
    },
    [fabricRef, syncShapeInStorage]
  );

  const memoizedShapes = useMemo(
    () => (
      <section className="flex flex-col pr-4 text-secondary min-w-[227px] sticky left-0 h-full max-sm:hidden select-none overflow-y-auto pb-20">
        <div className="flex flex-col">
          {orderedShapes?.map(
            (
              shape: [
                string,
                {
                  type?: string;
                  objectId?: string;
                  visible?: boolean;
                  [key: string]: unknown;
                }
              ],
              index: number
            ) => {
              const info = getShapeInfo(shape[1]?.type as string, shape[1]);
              const objectId = shape[1]?.objectId as string;
              const isActive =
                getObjectId(activeObjectRef.current!) === objectId;
              const isDragging = draggedLayer === objectId;
              const isDragOver = dragOverLayer === objectId;

              // Special visibility check for color layer
              let isVisible = shape[1]?.visible !== false;
              if (objectId === "color-layer" && fabricRef.current) {
                // Check visibility of actual color layer objects on canvas
                const colorObjects = fabricRef.current
                  .getObjects()
                  .filter((obj) => getObjectId(obj) === "color-layer");
                // Layer is visible if any color object is visible
                isVisible = colorObjects.some((obj) => obj.visible !== false);
              }

              return (
                <div
                  key={objectId}
                  draggable
                  onDragStart={(e) => handleDragStart(e, objectId)}
                  onDragOver={(e) => handleDragOver(e, objectId)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, objectId)}
                  onClick={() => handleLayerClick(objectId)}
                  className={`group rounded-md my-1 pl-6 flex items-center gap-2 pr-5 py-2.5 hover:cursor-pointer duration-200 ease-in-out relative
                  ${
                    isActive
                      ? "bg-primary text-white"
                      : "hover:bg-secondary hover:text-primary-black"
                  }
                  ${isDragging ? "opacity-50 bg-gray-200" : ""}
                  ${isDragOver ? "border-2 border-blue-400 bg-blue-50" : ""}
                  ${!isVisible ? "opacity-50" : ""}
                `}
                >
                  {/* Layer order indicator */}
                  <span className="text-xs opacity-60 min-w-[20px]">
                    {orderedShapes.length - index}
                  </span>

                  <Image
                    src={info?.icon}
                    alt="Layer"
                    width={16}
                    height={16}
                    className={`duration-200 ease-in-out ${
                      isActive ? "invert" : "group-hover:invert"
                    }`}
                  />

                  <h3 className="text-sm font-semibold capitalize flex-1">
                    {info.name}
                  </h3>

                  {/* Layer actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 duration-200">
                    {/* Move to front */}
                    <button
                      onClick={(e) => handleMoveToFront(objectId, e)}
                      className="p-1 hover:bg-gray-200 rounded text-xs"
                      title="Bring to front"
                    >
                      ↑
                    </button>

                    {/* Move to back */}
                    <button
                      onClick={(e) => handleMoveToBack(objectId, e)}
                      className="p-1 hover:bg-gray-200 rounded text-xs"
                      title="Send to back"
                    >
                      ↓
                    </button>
                  </div>

                  {/* Visibility toggle */}
                  <button
                    onClick={(e) => handleLayerVisibilityToggle(objectId, e)}
                    className="opacity-60 hover:opacity-100 duration-200 p-1"
                    title={isVisible ? "Hide layer" : "Show layer"}
                  >
                    {isVisible ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                      </svg>
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                      </svg>
                    )}
                  </button>
                </div>
              );
            }
          )}

          {orderedShapes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No layers yet</p>
              <p className="text-xs">Create shapes to see them here</p>
            </div>
          )}
        </div>
      </section>
    ),
    [
      orderedShapes,
      activeObjectRef,
      draggedLayer,
      dragOverLayer,
      handleDragStart,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      handleLayerClick,
      handleLayerVisibilityToggle,
      handleMoveToFront,
      handleMoveToBack,
      fabricRef,
    ]
  );

  return memoizedShapes;
};

export default Layers;
