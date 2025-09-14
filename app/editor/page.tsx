"use client";

import React, { useEffect, useRef, useState } from "react";
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
  initializeFabric,
  renderCanvas,
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
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase.config";

const Editor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const isDrawing = useRef(false);
  const shapeRef = useRef<fabric.Object | null>(null);
  const selectedShapeRef = useRef<string | null>(null);
  const activeObjectRef = useRef<fabric.Object | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const isEditingRef = useRef<boolean>(false);
  const [elementAttributes, setElementAttributes] = useState<Attributes>({
    width: "",
    height: "",
    fontSize: "",
    fontFamily: "",
    fontWeight: "",
    fill: "#aabbcc",
    stroke: "#aabbcc",
    opacity: "1",
  });

  const [activeElement, setActiveElement] = useState<ActiveElement>({
    name: "",
    icon: "",
    value: "",
  });

  const undo = useUndo();
  const redo = useRedo();
  const [userName, setUserName] = React.useState("");

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        const uid = user.uid;
        setUserName(user.email ?? "");
        console.log("uid", uid);
      } else {
        console.log("user is logged out");
      }
    });
  }, []);

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
  }, []);

  const handleActiveElement = (elem: ActiveElement) => {
    setActiveElement(elem);

    switch (elem?.value) {
      case "reset":
        deleteAllShapes();
        fabricRef.current?.clear();
        setActiveElement(defaultNavElement);
        break;
      case "delete":
        if (fabricRef.current) {
          handleDelete(fabricRef.current, deleteShapeFromStorage);
          setActiveElement(defaultNavElement);
        }

        break;
      case "image":
        imageInputRef.current?.click();
        isDrawing.current = false;
        if (fabricRef.current) {
          fabricRef.current.isDrawingMode = false;
        }
        break;
      default:
        break;
    }

    selectedShapeRef.current = elem?.value as string;
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

    const canvasObjects = storage.get("canvasObjects") as LiveMap<string, Lson>;

    canvasObjects?.set(objectId, shapeData);
  }, []);

  const syncAllShapesToStorage = useMutation(
    ({ storage }, objects: fabric.Object[]) => {
      const canvasObjects = storage.get("canvasObjects") as LiveMap<
        string,
        Lson
      >;

      objects.forEach((object) => {
        if (
          object &&
          (object as fabric.Object & { objectId: string }).objectId
        ) {
          const objectWithId = object as fabric.Object & { objectId: string };
          const { objectId } = objectWithId;
          // Use the same approach as syncShapeInStorage
          const shapeData = object.toJSON();
          (shapeData as Record<string, unknown>).objectId = objectId;
          canvasObjects?.set(objectId, shapeData as unknown as Lson);
        }
      });
    },
    []
  );

  const reorderShapes = useMutation(({ storage }, objects: fabric.Object[]) => {
    // Set flag to prevent renderCanvas from running
    isReorderingRef.current = true;

    const canvasObjects = storage.get("canvasObjects") as LiveMap<string, Lson>;

    objects.forEach((object) => {
      if (object && (object as fabric.Object & { objectId: string }).objectId) {
        const objectWithId = object as fabric.Object & { objectId: string };
        const { objectId } = objectWithId;
        const shapeData = object.toJSON();
        (shapeData as Record<string, unknown>).objectId = objectId;
        canvasObjects?.set(objectId, shapeData as unknown as Lson);
      }
    });

    // Reset flag after a short delay to allow the next render
    setTimeout(() => {
      isReorderingRef.current = false;
    }, 100);
  }, []);

  const [isCanvasInitialized, setIsCanvasInitialized] = useState(false);
  const isReorderingRef = useRef(false);

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
        console.log("mouse down");
        handleCanvasMouseDown({
          canvas,
          options,
          isDrawing,
          shapeRef,
          selectedShapeRef,
          activeObjectRef,
        });
      });

      canvas.on("mouse:up", () => {
        console.log("mouse up");
        handleCanvasMouseUp({
          canvas,
          isDrawing,
          shapeRef,
          selectedShapeRef,
          syncShapeInStorage,
          setActiveElement,
          activeObjectRef,
        });
      });

      canvas.on("mouse:move", (options) => {
        handleCanvaseMouseMove({
          canvas,
          options,
          isDrawing,
          shapeRef,
          selectedShapeRef,
          syncShapeInStorage,
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
        });
      });

      canvas.on("selection:updated", (options) => {
        handleCanvasSelectionUpdated({
          options,
          isEditingRef,
          setElementAttributes,
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
  }, [deleteShapeFromStorage, redo, syncShapeInStorage, undo]);

  useEffect(() => {
    if (isCanvasInitialized && fabricRef.current) {
      renderCanvas({ activeObjectRef, canvasObjects, fabricRef });
    }
  }, [canvasObjects, isCanvasInitialized]);

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
      />
    </div>
  );
};

export default Editor;
