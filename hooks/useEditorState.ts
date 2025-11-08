import { useState, useMemo } from "react";
import { ActiveElement, Attributes } from "@/types/type";
import { EditorState } from "@/types/editor.types";

export const useEditorState = (): EditorState => {
  const [elementAttributes, setElementAttributes] = useState<Attributes>({
    width: "",
    height: "",
    fontSize: "36",
    fontFamily: "Helvetica",
    fontWeight: "400",
    fill: "#aabbcc",
    stroke: "#aabbcc",
    opacity: "1",
    brushWidth: "20",
    brushColor: "#ffffff",
  });

  const [activeElement, setActiveElement] = useState<ActiveElement>({
    name: "",
    icon: "",
    value: "",
  });

  const [isPremadeShapesModalOpen, setIsPremadeShapesModalOpen] = useState(false);
  const [isCanvasInitialized, setIsCanvasInitialized] = useState(false);

  // Memoize the state object to prevent unnecessary re-renders
  return useMemo(() => ({
    elementAttributes,
    setElementAttributes,
    activeElement,
    setActiveElement,
    isPremadeShapesModalOpen,
    setIsPremadeShapesModalOpen,
    isCanvasInitialized,
    setIsCanvasInitialized,
  }), [
    elementAttributes,
    activeElement,
    isPremadeShapesModalOpen,
    isCanvasInitialized,
  ]);
};