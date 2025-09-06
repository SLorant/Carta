"use client";

import React, { useEffect, useRef, useState } from "react";
import Live from "@/components/Live";
import { Room } from "../Room";
import { fabric } from "fabric";
import {
  handleCanvaseMouseMove,
  handleCanvasMouseDown,
  handleCanvasMouseUp,
  handleCanvasObjectModified,
  handleResize,
  initializeFabric,
  renderCanvas,
} from "@/lib/canvas";
import Navbar from "@/components/Navbar";
import { ActiveElement } from "@/types/type";
import { useStorage } from "@/liveblocks.config";
import { useMutation } from "@liveblocks/react";
import type { LiveMap, Lson } from "@liveblocks/client";
import { defaultNavElement } from "@/constants";
import { handleDelete } from "@/lib/key-events";

const Editor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const isDrawing = useRef(false);
  const shapeRef = useRef<fabric.Object | null>(null);
  const selectedShapeRef = useRef<string | null>("rectangle");
  const activeObjectRef = useRef<fabric.Object | null>(null);

  const [activeElement, setActiveElement] = useState<ActiveElement>({
    name: "",
    icon: "",
    value: "",
  });

  const deleteAllShapes = useMutation(({ storage }) => {
    const canvasObjects = storage.get("canvasObjects") as LiveMap<string, Lson>;

    if (!canvasObjects || canvasObjects.size === 0) return true;

    for (const [key, value] of canvasObjects.entries()) {
      canvasObjects.delete(key);
    }

    return canvasObjects.size === 0;
  }, []);

  const deleteShapeFromStorage = useMutation(({ storage }, objectId) => {
    const canvasObjects = storage.get("canvasObjects") as LiveMap<string, Lson>;

    canvasObjects.delete(objectId);
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
        handleDelete(fabricRef.current, deleteShapeFromStorage);
        setActiveElement(defaultNavElement);
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

    const canvasObjects = storage.get("canvasObjects") as LiveMap<string, Lson>;

    canvasObjects?.set(objectId, shapeData);
  }, []);

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

      const handleWindowResize = () => {
        handleResize({ canvas });
      };

      window.addEventListener("resize", handleWindowResize);

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
  }, []);
  const ref = useRef(null);

  useEffect(() => {
    renderCanvas({ activeObjectRef, canvasObjects, fabricRef });
  }, [canvasObjects]);

  return (
    <>
      <Navbar
        activeElement={activeElement}
        handleActiveElement={handleActiveElement}
        handleImageUpload={() => {}}
        imageInputRef={ref}
      />
      <Live canvasRef={canvasRef} />
    </>
  );
};

export default Editor;
