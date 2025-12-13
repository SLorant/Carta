export {
  // Core functionality
  initializeFabric,
  renderCanvas,

  // Event handlers
  handleCanvasMouseDown,
  handleCanvaseMouseMove,
  handleCanvasMouseUp,
  handleCanvasObjectModified,
  handleCanvasObjectMoving,
  handleCanvasObjectScaling,
  handleCanvasSelectionCreated,
  handleCanvasSelectionUpdated,
  handlePathCreated,

  // Viewport management
  handleCanvasZoom,
  handleZoomIn,
  handleZoomOut,
  handleZoomReset,
  handleResize,

  // Brush management
  configureFreeDrawingBrush,
  updateBrushSettings,

  // Types and constants
  CANVAS_CONSTANTS,
  CANVAS_EVENTS,

  // Managers (for advanced usage)
  ViewportManager,
  BrushManager,
  ZIndexManager,
  ColorLayerManager,
  PremadeShapeManager,

  // Core classes (for advanced usage)
  CanvasInitializer,
  CanvasRenderer,
  MouseEventHandler,
  CanvasEventHandler,

  // Types
  type FabricObjectWithId,
  type BrushSettings,
  type ZoomConfig,
  type CanvasConfig,
} from "./canvas/index";
