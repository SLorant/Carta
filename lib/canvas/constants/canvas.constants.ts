export const CANVAS_CONSTANTS = {
  ZOOM: {
    MIN: 0.2,
    MAX: 10,
    STEP: 0.1,
    WHEEL_STEP: 0.001,
    DEFAULT: 1,
  },
  COLORS: {
    LAYER_OBJECT_ID: "color-layer",
    BASE_Z_INDEX: -1000,
  },
  BACKGROUND: {
    DEFAULT_COLOR: "#224477",
    TEXTURE_URL: "/textures/sea.png",
  },
  SHAPES: {
    DEFAULT_SIZE: 50,
    PREMADE_PREFIX: "premade:",
  },
  TIMEOUTS: {
    PREMADE_CREATION: 5000,
  },
} as const;

export const CANVAS_EVENTS = {
  MOUSE_DOWN: "mouse:down",
  MOUSE_MOVE: "mouse:move",
  MOUSE_UP: "mouse:up",
  OBJECT_MODIFIED: "object:modified",
  OBJECT_SCALING: "object:scaling",
  OBJECT_MOVING: "object:moving",
  PATH_CREATED: "path:created",
  SELECTION_CREATED: "selection:created",
  SELECTION_UPDATED: "selection:updated",
  MOUSE_WHEEL: "mouse:wheel",
} as const;
