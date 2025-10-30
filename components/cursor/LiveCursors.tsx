import Cursor from "./Cursor";
import { COLORS } from "@/constants";
import { useOthers } from "@/liveblocks.config";

const LiveCursors = () => {
  const others = useOthers();

  return others.map(({ connectionId, presence, id }) => {
    if (!presence?.cursor) return null;

    // Use user ID for consistent colors, fallback to connectionId
    const colorIndex = id
      ? Math.abs(
          id.split("").reduce((hash, char) => hash + char.charCodeAt(0), 0)
        ) % COLORS.length
      : Number(connectionId) % COLORS.length;

    return (
      <Cursor
        key={connectionId}
        color={COLORS[colorIndex]}
        x={presence.cursor.x}
        y={presence.cursor.y}
        message={presence.message || ""}
      />
    );
  });
};

export default LiveCursors;
