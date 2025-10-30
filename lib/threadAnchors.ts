import { fabric } from "fabric";

// Thread anchor objects are invisible Fabric.js objects that track thread positions
export interface ThreadAnchor extends fabric.Rect {
  threadId: string;
  isThreadAnchor: boolean;
}

/**
 * Create an invisible Fabric.js object to track a thread's position
 */
export const createThreadAnchor = (
  canvas: fabric.Canvas,
  threadId: string,
  x: number,
  y: number
): ThreadAnchor => {
  const anchor = new fabric.Rect({
    left: x,
    top: y,
    width: 1,
    height: 1,
    fill: "transparent",
    stroke: "transparent",
    selectable: false,
    evented: false,
    visible: false,
    excludeFromExport: true,
    hoverCursor: "default",
    moveCursor: "default",
  }) as ThreadAnchor;

  // Add custom properties to identify this as a thread anchor
  anchor.threadId = threadId;
  anchor.isThreadAnchor = true;

  canvas.add(anchor);
  return anchor;
};

/**
 * Get the screen position of a thread anchor
 */
export const getThreadAnchorScreenPosition = (
  canvas: fabric.Canvas,
  anchor: ThreadAnchor
): { x: number; y: number } => {
  // Get the canvas element's position on screen
  const canvasElement = canvas.getElement();
  const canvasRect = canvasElement.getBoundingClientRect();

  // Get the anchor's position in canvas coordinates
  const anchorLeft = anchor.left || 0;
  const anchorTop = anchor.top || 0;

  // Transform canvas coordinates to screen coordinates using Fabric's viewport
  const zoom = canvas.getZoom();
  const vpt = canvas.viewportTransform;

  if (!vpt) {
    return { x: anchorLeft + canvasRect.left, y: anchorTop + canvasRect.top };
  }

  // Apply zoom and pan transformations
  const screenX = anchorLeft * zoom + vpt[4] + canvasRect.left;
  const screenY = anchorTop * zoom + vpt[5] + canvasRect.top;

  return { x: screenX, y: screenY };
};

/**
 * Find a thread anchor by thread ID
 */
export const findThreadAnchor = (
  canvas: fabric.Canvas,
  threadId: string
): ThreadAnchor | null => {
  const objects = canvas.getObjects();
  const anchor = objects.find(
    (obj): obj is ThreadAnchor =>
      (obj as ThreadAnchor).isThreadAnchor === true &&
      (obj as ThreadAnchor).threadId === threadId
  );
  return anchor || null;
};

/**
 * Remove a thread anchor when a thread is deleted
 */
export const removeThreadAnchor = (
  canvas: fabric.Canvas,
  threadId: string
): void => {
  const anchor = findThreadAnchor(canvas, threadId);
  if (anchor) {
    canvas.remove(anchor);
  }
};

/**
 * Get all thread anchors
 */
export const getAllThreadAnchors = (canvas: fabric.Canvas): ThreadAnchor[] => {
  const objects = canvas.getObjects();
  return objects.filter(
    (obj): obj is ThreadAnchor => (obj as ThreadAnchor).isThreadAnchor === true
  );
};

/**
 * Clean up orphaned thread anchors (anchors without corresponding threads)
 */
export const cleanupOrphanedAnchors = (
  canvas: fabric.Canvas,
  existingThreadIds: string[]
): void => {
  const anchors = getAllThreadAnchors(canvas);
  const existingIds = new Set(existingThreadIds);

  anchors.forEach((anchor) => {
    if (!existingIds.has(anchor.threadId)) {
      canvas.remove(anchor);
    }
  });
};
