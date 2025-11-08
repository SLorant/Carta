import React from "react";
import { useStorage } from "@/liveblocks.config";
import { useRedo, useUndo } from "@liveblocks/react";
import { useAuth } from "@/components/AuthProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useCanvasRefs } from "@/hooks/useCanvasRefs";
import { useEditorState } from "@/hooks/useEditorState";
import { useCanvasManagement } from "@/hooks/useCanvasManagement";
import { useCanvasOperations } from "@/hooks/useCanvasRefs";
import { handleImageUpload } from "@/lib/shapes";
import Live from "@/components/Live";
import RightSideBar from "@/components/RightSideBar";
import LeftSideBar from "@/components/LeftSideBar";
import TopBar from "@/components/TopBar";
import PremadeShapesModal from "@/components/PremadeShapesModal";

export const EditorCanvas: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const undo = useUndo();
  const redo = useRedo();
  const canvasObjects = useStorage((root) => root.canvasObjects);

  // Initialize hooks
  const refs = useCanvasRefs();
  const state = useEditorState();
  
  // Canvas management
  const canvasManagement = useCanvasManagement(refs, state, {
    undo,
    redo,
    canvasObjects,
  });

  // Canvas operations
  const operations = useCanvasOperations(
    refs.fabricRef,
    canvasManagement.deleteAllShapes,
    canvasManagement.deleteShapeFromStorage,
    canvasManagement.syncShapeInStorage
  );

  const userName = profile?.username || user?.email || "";

  const handleImageUploadWrapper = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (file && refs.fabricRef.current) {
      handleImageUpload({
        file,
        canvas: refs.fabricRef,
        shapeRef: refs.shapeRef,
        syncShapeInStorage: canvasManagement.syncShapeInStorage,
      });
    }
  };

  return (
    <div className="overflow-hidden relative w-screen h-screen">
      <TopBar userName={userName} />
      
      <LeftSideBar
        activeElement={state.activeElement}
        handleActiveElement={canvasManagement.handleActiveElement}
        handleImageUpload={handleImageUploadWrapper}
        imageInputRef={refs.imageInputRef}
        handleZoomIn={operations.handleZoomInCanvas}
        handleZoomOut={operations.handleZoomOutCanvas}
        handleZoomReset={operations.handleZoomResetCanvas}
        fabricRef={refs.fabricRef}
      />
      
      <Live
        canvasRef={refs.canvasRef}
        fabricRef={refs.fabricRef}
        undo={undo}
        redo={redo}
      />
      
      <RightSideBar
        elementAttributes={state.elementAttributes}
        activeObjectRef={refs.activeObjectRef}
        fabricRef={refs.fabricRef}
        isEditingRef={refs.isEditingRef}
        setElementAttributes={state.setElementAttributes}
        syncShapeInStorage={canvasManagement.syncShapeInStorage}
        allShapes={Array.from(canvasObjects) as unknown as fabric.Object[]}
        selectedShapeRef={refs.selectedShapeRef}
      />
      
      <PremadeShapesModal
        isOpen={state.isPremadeShapesModalOpen}
        onClose={() => state.setIsPremadeShapesModalOpen(false)}
        onSelectShape={canvasManagement.handlePremadeShapeSelect}
      />
    </div>
  );
};