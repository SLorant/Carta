import { fabric } from "fabric";
import { v4 as uuidv4 } from "uuid";

import {
  CustomFabricObject,
  ElementDirection,
  ImageUpload,
  ModifyShape,
} from "@/types/type";

export const createRectangle = (pointer: PointerEvent) => {
  const rect = new fabric.Rect({
    left: pointer.x,
    top: pointer.y,
    width: 10,
    height: 10,
    fill: "#fff",
    objectId: uuidv4(),
  } as CustomFabricObject);

  return rect;
};

export const createTriangle = (pointer: PointerEvent) => {
  return new fabric.Triangle({
    left: pointer.x,
    top: pointer.y,
    width: 100,
    height: 100,
    fill: "#fff",
    objectId: uuidv4(),
  } as CustomFabricObject);
};

export const createCircle = (pointer: PointerEvent) => {
  const circle = new fabric.Circle({
    left: pointer.x,
    top: pointer.y,
    radius: 100,
    fill: "#fff",
  });
  (circle as fabric.Circle & { objectId?: string }).objectId = uuidv4();
  return circle;
};

export const createLine = (pointer: PointerEvent) => {
  return new fabric.Line(
    [pointer.x, pointer.y, pointer.x + 100, pointer.y + 100],
    {
      stroke: "#fff",
      strokeWidth: 2,
      objectId: uuidv4(),
    } as CustomFabricObject
  );
};

export const createText = (pointer: PointerEvent, text: string) => {
  return new fabric.IText(text, {
    left: pointer.x,
    top: pointer.y,
    fill: "#fff",
    fontFamily: "Helvetica",
    fontSize: 36,
    fontWeight: "400",
    objectId: uuidv4(),
  } as fabric.ITextOptions);
};

export const createSpecificShape = (
  shapeType: string,
  pointer: PointerEvent
) => {
  switch (shapeType) {
    case "rectangle":
      return createRectangle(pointer);

    case "triangle":
      return createTriangle(pointer);

    case "circle":
      return createCircle(pointer);

    case "line":
      return createLine(pointer);

    case "text":
      return createText(pointer, "Tap to Type");

    default:
      return null;
  }
};

export const handleImageUpload = ({
  file,
  canvas,
  shapeRef,
  syncShapeInStorage,
}: ImageUpload) => {
  const reader = new FileReader();

  reader.onload = () => {
    fabric.Image.fromURL(reader.result as string, (img) => {
      img.scaleToWidth(200);
      img.scaleToHeight(200);

      // Don't add to canvas immediately - prepare for placement
      (img as fabric.Image & { objectId?: string }).objectId = uuidv4();

      // Store the prepared image for placement on next click
      shapeRef.current = img;

      // Don't sync to storage yet - wait for placement
    });
  };

  reader.readAsDataURL(file);
};

export const handlePremadeShapeUpload = ({
  shapeSrc,
  canvas,
  shapeRef,
  syncShapeInStorage,
}: {
  shapeSrc: string;
  canvas: React.MutableRefObject<fabric.Canvas | null>;
  shapeRef: React.MutableRefObject<fabric.Object | null>;
  syncShapeInStorage: (shape: fabric.Object) => void;
}) => {
  fabric.Image.fromURL(shapeSrc, (img) => {
    img.scaleToWidth(200);
    img.scaleToHeight(200);

    // Don't add to canvas immediately - prepare for placement
    (img as fabric.Image & { objectId?: string }).objectId = uuidv4();

    // Store the prepared image for placement on next click
    shapeRef.current = img;

    // Don't sync to storage yet - wait for placement
  });
};

export const createShape = (
  canvas: fabric.Canvas,
  pointer: PointerEvent,
  shapeType: string
) => {
  if (shapeType === "freeform" || shapeType === "color") {
    canvas.isDrawingMode = true;
    return null;
  }

  return createSpecificShape(shapeType, pointer);
};

export const modifyShape = ({
  canvas,
  property,
  value,
  activeObjectRef,
  syncShapeInStorage,
}: ModifyShape) => {
  const selectedElement = canvas.getActiveObject();

  if (!selectedElement || selectedElement?.type === "activeSelection") return;

  // if  property is width or height, set the scale of the selected element
  if (property === "width") {
    selectedElement.set("scaleX", 1);
    selectedElement.set("width", Number(value));
  } else if (property === "height") {
    selectedElement.set("scaleY", 1);
    selectedElement.set("height", Number(value));
  } else if (property === "opacity") {
    // Convert opacity to number for fabric.js
    selectedElement.set("opacity", Number(value));
  } else {
    if (
      (selectedElement as fabric.Object)[property as keyof fabric.Object] ===
      value
    )
      return;
    selectedElement.set({ [property]: value });
  }

  // set selectedElement to activeObjectRef
  activeObjectRef.current = selectedElement;

  syncShapeInStorage(selectedElement);
};

export const bringElement = ({
  canvas,
  direction,
  syncShapeInStorage,
}: ElementDirection) => {
  if (!canvas) return;

  // get the selected element. If there is no selected element or there are more than one selected element, return
  const selectedElement = canvas.getActiveObject();

  if (!selectedElement || selectedElement?.type === "activeSelection") return;

  // bring the selected element to the front
  if (direction === "front") {
    canvas.bringToFront(selectedElement);
  } else if (direction === "back") {
    canvas.sendToBack(selectedElement);
  }

  // canvas.renderAll();
  syncShapeInStorage(selectedElement);

  // re-render all objects on the canvas
};
