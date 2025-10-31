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

export const handleImageUpload = ({ file, shapeRef }: ImageUpload) => {
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
  shapeRef,
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
  if (shapeType === "color") {
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

  // Handle width and height changes based on shape type
  if (property === "width") {
    if (selectedElement.type === "circle") {
      // For circles, calculate radius from width
      const radius = Number(value) / 2;
      (selectedElement as fabric.Circle).set("radius", radius);
      selectedElement.set("scaleX", 1);
      selectedElement.set("scaleY", 1);
    } else if (selectedElement.type === "image") {
      // For images (including premade shapes), use scaling
      const scaleX = Number(value) / selectedElement.width!;
      selectedElement.set("scaleX", scaleX);
    } else {
      // For rectangles and other shapes with native width property
      selectedElement.set("scaleX", 1);
      selectedElement.set("width", Number(value));
    }
  } else if (property === "height") {
    if (selectedElement.type === "circle") {
      // For circles, calculate radius from height
      const radius = Number(value) / 2;
      (selectedElement as fabric.Circle).set("radius", radius);
      selectedElement.set("scaleX", 1);
      selectedElement.set("scaleY", 1);
    } else if (selectedElement.type === "image") {
      // For images (including premade shapes), use scaling
      const scaleY = Number(value) / selectedElement.height!;
      selectedElement.set("scaleY", scaleY);
    } else {
      // For rectangles and other shapes with native height property
      selectedElement.set("scaleY", 1);
      selectedElement.set("height", Number(value));
    }
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
