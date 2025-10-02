"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Live from "@/components/Live";
import { fabric } from "fabric";
import {
  handleCanvaseMouseMove,
  handleCanvasMouseDown,
  handleCanvasMouseUp,
  handleCanvasObjectModified,
  handleCanvasObjectScaling,
  handleCanvasSelectionCreated,
  handleCanvasSelectionUpdated,
  handlePathCreated,
  handleResize,
  handleCanvasZoom,
  handleZoomIn,
  handleZoomOut,
  handleZoomReset,
  initializeFabric,
  renderCanvas,
  updateBrushSettings,
} from "@/lib/canvas";
import { ActiveElement, Attributes } from "@/types/type";
import { useStorage } from "@/liveblocks.config";
import { useMutation, useRedo, useUndo } from "@liveblocks/react";
import type { LiveMap, Lson } from "@liveblocks/client";
import { defaultNavElement } from "@/constants";
import { handleDelete, handleKeyDown } from "@/lib/key-events";
import RightSideBar from "@/components/RightSideBar";
import { handleImageUpload } from "@/lib/shapes";
import LeftSideBar from "@/components/LeftSideBar";
import TopBar from "@/components/TopBar";
import { Room } from "@/app/Room";
import { useAuth } from "@/components/AuthProvider";
import PremadeShapesModal, {
  PremadeShape,
} from "@/components/PremadeShapesModal";
import { useUserProfile } from "@/hooks/useUserProfile";

function EditorContent() {
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const isDrawing = useRef(false);
  const shapeRef = useRef<fabric.Object | null>(null);
  const selectedShapeRef = useRef<string | null>(null);
  const activeObjectRef = useRef<fabric.Object | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const isEditingRef = useRef<boolean>(false);
  const isPanning = useRef(false);
  const lastPanPoint = useRef<{ x: number; y: number } | null>(null);
  const [elementAttributes, setElementAttributes] = useState<Attributes>({
    width: "",
    height: "",
    fontSize: "",
    fontFamily: "",
    fontWeight: "",
    fill: "#aabbcc",
    stroke: "#aabbcc",
    opacity: "1",
    brushWidth: "20",
    brushColor: "#ffffff",
    brushTexture: "continental",
    brushRoughness: "75",
  });

  const [activeElement, setActiveElement] = useState<ActiveElement>({
    name: "",
    icon: "",
    value: "",
  });

  const [isPremadeShapesModalOpen, setIsPremadeShapesModalOpen] =
    useState(false);

  const undo = useUndo();
  const redo = useRedo();

  const userName = profile?.username || user?.email || "";

  // Zoom handler functions
  const handleZoomInCanvas = () => {
    if (fabricRef.current) {
      handleZoomIn(fabricRef.current);
    }
  };

  const handleZoomOutCanvas = () => {
    if (fabricRef.current) {
      handleZoomOut(fabricRef.current);
    }
  };

  const handleZoomResetCanvas = () => {
    if (fabricRef.current) {
      handleZoomReset(fabricRef.current);
    }
  };

  const deleteAllShapes = useMutation(({ storage }) => {
    const canvasObjects = storage.get("canvasObjects") as LiveMap<string, Lson>;

    if (!canvasObjects || canvasObjects.size === 0) return true;

    for (const [key] of canvasObjects.entries()) {
      canvasObjects.delete(key);
    }

    return canvasObjects.size === 0;
  }, []);

  const deleteShapeFromStorage = useMutation(({ storage }, objectId) => {
    const canvasObjects = storage.get("canvasObjects") as LiveMap<string, Lson>;
    console.log(canvasObjects);
    canvasObjects.delete(objectId);
  }, []);

  useEffect(() => {
    const onKeyUp = (event: KeyboardEvent) => {
      if (
        event.key === "Delete" &&
        activeElement !== defaultNavElement &&
        fabricRef.current
      ) {
        handleDelete(fabricRef.current, deleteShapeFromStorage);
        setActiveElement(defaultNavElement);
        console.log("delete");
      }
    };

    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [activeElement, deleteShapeFromStorage]);

  const handlePremadeShapeSelect = (shape: PremadeShape) => {
    // Set the selected shape ref to enable multiple placements, including shape name
    selectedShapeRef.current = `premade:${shape.src}:${shape.name}`;

    // Set the active element to show premade shapes is active
    setActiveElement({
      icon: "/assets/shapes.svg",
      name: "Premade Shapes",
      value: "premade-shapes",
    });

    // We don't need to prepare an instance since we create new ones on each click
    // The old approach was preparing one instance, but now we create fresh ones each time
  };

  const handleActiveElement = (elem: ActiveElement) => {
    setActiveElement(elem);

    // Handle delete case first, before clearing selection
    if (elem?.value === "delete") {
      if (fabricRef.current) {
        handleDelete(fabricRef.current, deleteShapeFromStorage);
        setActiveElement(defaultNavElement);
      }
      return;
    }

    // Clear all references and canvas selection when switching tools
    activeObjectRef.current = null;
    selectedShapeRef.current = null;
    shapeRef.current = null;

    // Clear canvas selection if switching to a creation tool or select tool
    if (fabricRef.current) {
      fabricRef.current.discardActiveObject();
      fabricRef.current.renderAll();
    }

    switch (elem?.value) {
      case "reset":
        deleteAllShapes();
        fabricRef.current?.clear();
        setActiveElement(defaultNavElement);
        break;
      case "image":
        imageInputRef.current?.click();
        isDrawing.current = false;
        if (fabricRef.current) {
          fabricRef.current.isDrawingMode = false;
        }
        // Don't set selectedShapeRef for images - they're handled differently
        selectedShapeRef.current = null;
        return; // Return early to avoid setting selectedShapeRef at the end
      case "premade-shapes":
        setIsPremadeShapesModalOpen(true);
        isDrawing.current = false;
        if (fabricRef.current) {
          fabricRef.current.isDrawingMode = false;
        }
        // Don't set selectedShapeRef for premade shapes - they're handled differently
        selectedShapeRef.current = null;
        return; // Return early to avoid setting selectedShapeRef at the end
      default:
        break;
    }

    // Set the selected shape reference based on the tool
    // For select tool, set to null to enable pure selection mode
    selectedShapeRef.current =
      elem?.value === "select" ? null : (elem?.value as string);
  };

  const canvasObjects = useStorage((root) => root.canvasObjects);

  const syncShapeInStorage = useMutation(({ storage }, object) => {
    if (!object) return;
    const { objectId } = object;

    const shapeData = object.toJSON();
    shapeData.objectId = objectId;

    // Include custom zIndex property in storage
    if ((object as fabric.Object & { zIndex?: number }).zIndex !== undefined) {
      (shapeData as Record<string, unknown>).zIndex = (
        object as fabric.Object & { zIndex: number }
      ).zIndex;
    }

    // Include custom premadeName property in storage for premade shapes
    if (
      (object as fabric.Object & { premadeName?: string }).premadeName !==
      undefined
    ) {
      (shapeData as Record<string, unknown>).premadeName = (
        object as fabric.Object & { premadeName: string }
      ).premadeName;
    }

    const canvasObjects = storage.get("canvasObjects") as LiveMap<string, Lson>;

    canvasObjects?.set(objectId, shapeData);
  }, []);

  const [isCanvasInitialized, setIsCanvasInitialized] = useState(false);

  useEffect(() => {
    console.log("useEffect running, canvasRef:", canvasRef);

    // Use setTimeout to wait for the next tick when the DOM is ready
    const timeoutId = setTimeout(() => {
      if (!canvasRef.current) {
        console.log("Canvas ref is still null after timeout");
        return;
      }

      console.log("Canvas ref is available, initializing fabric...");
      const canvas = initializeFabric({ canvasRef, fabricRef });

      canvas.on("mouse:down", (options) => {
        // Handle canvas interactions including panning with middle mouse button
        handleCanvasMouseDown({
          canvas,
          options,
          isDrawing,
          shapeRef,
          selectedShapeRef,
          activeObjectRef,
          isPanning,
          lastPanPoint,
          syncShapeInStorage,
          setActiveElement: handleActiveElement,
          brushSettings: {
            width: parseInt(elementAttributes.brushWidth),
            color: elementAttributes.brushColor,
            texture: elementAttributes.brushTexture,
            roughness: parseInt(elementAttributes.brushRoughness),
          },
        });
      });

      canvas.on("mouse:up", (options) => {
        // Handle canvas mouse up including panning
        handleCanvasMouseUp({
          isDrawing,
          shapeRef,
          selectedShapeRef,
          syncShapeInStorage,
          isPanning,
          lastPanPoint,
          options,
          canvas,
        });
      });

      canvas.on("mouse:move", (options) => {
        // Handle canvas mouse move including panning
        handleCanvaseMouseMove({
          canvas,
          options,
          isDrawing,
          shapeRef,
          selectedShapeRef,
          syncShapeInStorage,
          isPanning,
          lastPanPoint,
        });
      });

      canvas.on("object:modified", (options) => {
        handleCanvasObjectModified({
          options,
          syncShapeInStorage,
        });
      });

      canvas.on("selection:created", (options) => {
        handleCanvasSelectionCreated({
          options,
          isEditingRef,
          setElementAttributes,
          setActiveElement,
          selectedShapeRef,
        });
      });

      canvas.on("selection:updated", (options) => {
        handleCanvasSelectionUpdated({
          options,
          isEditingRef,
          setElementAttributes,
          setActiveElement,
          selectedShapeRef,
        });
      });

      canvas.on("object:scaling", (options) => {
        handleCanvasObjectScaling({
          options,
          setElementAttributes,
        });
      });

      canvas.on("path:created", (options) => {
        handlePathCreated({
          options,
          syncShapeInStorage,
        });
      });

      canvas.on("mouse:wheel", (options) => {
        handleCanvasZoom({
          options,
          canvas,
        });
      });

      const handleWindowResize = () => {
        handleResize({ canvas });
      };

      window.addEventListener("resize", handleWindowResize);

      window.addEventListener("keydown", (e) => {
        handleKeyDown({
          e,
          canvas,
          undo,
          deleteShapeFromStorage,
          redo,
          syncShapeInStorage,
        });
      });

      // Mark canvas as initialized and trigger initial render
      setIsCanvasInitialized(true);

      return () => {
        canvas.dispose();
      };
    }, 500); // Run in next tick

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
    };
  }, [
    deleteShapeFromStorage,
    redo,
    syncShapeInStorage,
    undo,
    /*     elementAttributes.brushWidth,
    elementAttributes.brushColor,
    elementAttributes.brushTexture,
    elementAttributes.brushRoughness, */
  ]);

  useEffect(() => {
    if (isCanvasInitialized && fabricRef.current) {
      renderCanvas({ activeObjectRef, canvasObjects, fabricRef });
    }
  }, [canvasObjects, isCanvasInitialized]);

  // Update brush settings when elementAttributes change and user is in drawing mode
  useEffect(() => {
    if (fabricRef.current && selectedShapeRef.current === "freeform") {
      updateBrushSettings(fabricRef.current, {
        width: parseInt(elementAttributes.brushWidth),
        color: elementAttributes.brushColor,
        texture: elementAttributes.brushTexture,
        roughness: parseInt(elementAttributes.brushRoughness),
      });
    }
  }, [
    elementAttributes.brushWidth,
    elementAttributes.brushColor,
    elementAttributes.brushTexture,
    elementAttributes.brushRoughness,
  ]);

  return (
    <div className="overflow-hidden relative w-screen h-screen">
      <TopBar userName={userName} />
      <LeftSideBar
        activeElement={activeElement}
        handleActiveElement={handleActiveElement}
        handleImageUpload={(e) => {
          e.stopPropagation();
          const file = e.target.files?.[0];
          if (file && fabricRef.current) {
            handleImageUpload({
              file,
              canvas: fabricRef,
              shapeRef,
              syncShapeInStorage,
            });
          }
        }}
        imageInputRef={imageInputRef}
        handleZoomIn={handleZoomInCanvas}
        handleZoomOut={handleZoomOutCanvas}
        handleZoomReset={handleZoomResetCanvas}
      />
      <Live canvasRef={canvasRef} undo={undo} redo={redo} />
      <RightSideBar
        elementAttributes={elementAttributes}
        activeObjectRef={activeObjectRef}
        fabricRef={fabricRef}
        isEditingRef={isEditingRef}
        setElementAttributes={setElementAttributes}
        syncShapeInStorage={syncShapeInStorage}
        allShapes={Array.from(canvasObjects)}
        selectedShapeRef={selectedShapeRef}
      />
      <PremadeShapesModal
        isOpen={isPremadeShapesModalOpen}
        onClose={() => setIsPremadeShapesModalOpen(false)}
        onSelectShape={handlePremadeShapeSelect}
      />
    </div>
  );
}

export default function Editor() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId") || "default-room";

  return (
    <Room roomId={roomId}>
      <EditorContent />
    </Room>
  );
}
