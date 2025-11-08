import {
  useBroadcastEvent,
  useEventListener,
  useMyPresence,
} from "@liveblocks/react";
import LiveCursors from "./cursor/LiveCursors";
import React, { useCallback, useEffect, useState } from "react";
import CursorChat from "./cursor/CursorChat";
import { CursorMode, CursorState, Reaction, ReactionEvent } from "@/types/type";
import ReactionSelector from "./reaction/ReactionButton";
import FlyingReaction from "./reaction/FlyingReaction";
import useInterval from "@/hooks/useInterval";
import { shortcuts } from "@/constants";
import { Comments } from "./comments/Comments";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./ui/context-menu";
import BackgroundBlur from "./BackgroundBlur";
import { fabric } from "fabric";

type Props = {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  fabricRef: React.MutableRefObject<fabric.Canvas | null>;
  undo: () => void;
  redo: () => void;
};

const Live = ({ canvasRef, fabricRef, undo, redo }: Props) => {
  const [{ cursor }, updateMyPresence] = useMyPresence();
  const [cursorState, setCursorState] = useState<CursorState>({
    mode: CursorMode.Hidden,
  });

  const [reaction, setReaction] = useState<Reaction[]>([]);

  const broadcast = useBroadcastEvent();

  useInterval(() => {
    setReaction((reaction) =>
      reaction.filter((r) => r.timestamp > Date.now() - 4000)
    );
  }, 1000);

  useInterval(() => {
    if (
      cursorState.mode === CursorMode.Reaction &&
      cursorState.isPressed &&
      cursor
    ) {
      const cursorPos = cursor as { x: number; y: number };
      setReaction((reactions) =>
        reactions.concat([
          {
            point: { x: cursorPos.x, y: cursorPos.y },
            value: cursorState.reaction,
            timestamp: Date.now(),
          },
        ])
      );

      broadcast({
        x: cursorPos.x,
        y: cursorPos.y,
        value: cursorState.reaction,
      });
    }
  }, 100);

  useEventListener((eventData) => {
    const event = eventData.event as ReactionEvent;

    setReaction((reactions) =>
      reactions.concat([
        {
          point: { x: event.x, y: event.y },
          value: event.value,
          timestamp: Date.now(),
        },
      ])
    );
  });

  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    event.preventDefault();

    if (cursor === null || cursorState.mode !== CursorMode.ReactionSelector) {
      const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
      const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

      updateMyPresence({ cursor: { x, y } });
    }
  }, []);

  const handlePointerLeave = useCallback(() => {
    setCursorState({ mode: CursorMode.Hidden });

    updateMyPresence({ cursor: null, message: null });
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
      const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

      updateMyPresence({ cursor: { x, y } });

      // Ensure the canvas area has focus for keyboard events
      const canvasElement = document.getElementById("canvas");
      if (canvasElement) {
        canvasElement.focus();
      }

      setCursorState((state: CursorState) =>
        state.mode === CursorMode.Reaction
          ? { ...state, isPressed: true }
          : state
      );
    },
    [cursorState.mode, setCursorState]
  );

  const handlePointerUp = useCallback(() => {
    setCursorState((state: CursorState) =>
      cursorState.mode === CursorMode.Reaction
        ? { ...state, isPressed: true }
        : state
    );
  }, [cursorState.mode, setCursorState]);

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      // Only handle specific keys for Live component functionality
      if (event.key === "/") {
        setCursorState({
          mode: CursorMode.Chat,
          previousMessage: null,
          message: "",
        });
      } else if (event.key === "Escape") {
        updateMyPresence({ message: "" });
        setCursorState({
          mode: CursorMode.Hidden,
        });
      } else if (event.key === "e") {
        setCursorState({
          mode: CursorMode.ReactionSelector,
        });
      }
    },
    [updateMyPresence]
  );

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Only prevent default for specific keys that this component handles
    if (event.key === "/") {
      event.preventDefault();
    }
    // Don't interfere with other keyboard shortcuts like Ctrl+C, Ctrl+V, Ctrl+Z, etc.
  }, []);

  useEffect(() => {
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyUp, handleKeyDown]);

  const setReactions = useCallback((reaction: string) => {
    setCursorState({ mode: CursorMode.Reaction, reaction, isPressed: false });
  }, []);

  const handleContextMenuClick = useCallback((key: string) => {
    switch (key) {
      case "Chat":
        setCursorState({
          mode: CursorMode.Chat,
          previousMessage: null,
          message: "",
        });
        break;
      case "Undo":
        undo();
        break;
      case "Redo":
        redo();
        break;
      case "Reactions":
        setCursorState({
          mode: CursorMode.ReactionSelector,
        });
        break;
      default:
        break;
    }
  }, []);

  return (
    <>
      <BackgroundBlur />
      <ContextMenu>
        <ContextMenuTrigger
          className="z-40 pt-[10%] pl-[10%] pr-[20%] pb-[5%] relative w-screen h-screen  flex flex-1 flex-col items-center justify-start"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          id="canvas"
          tabIndex={0}
          style={{
            cursor: cursorState.mode === CursorMode.Chat ? "none" : "auto",
            outline: "none", // Remove focus outline since this is a canvas area
          }}
        >
          <div className="relative w-full h-full">
            <canvas ref={canvasRef} className="z-40 w-full h-full" />
            <div
              className="absolute top-0 left-0 w-full h-full z-50 opacity-50 pointer-events-none"
              style={{
                backgroundImage: "url('/textures/mild.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                mixBlendMode: "multiply",
              }}
            />
          </div>

          {reaction.map((reaction) => (
            <FlyingReaction
              key={reaction.timestamp.toString()}
              x={reaction.point.x}
              y={reaction.point.y}
              timestamp={reaction.timestamp}
              value={reaction.value}
            />
          ))}

          {cursor && (
            <CursorChat
              cursor={cursor as { x: number; y: number }}
              cursorState={cursorState}
              setCursorState={setCursorState}
              updateMyPresence={updateMyPresence}
            />
          )}
          {cursorState.mode === CursorMode.ReactionSelector && (
            <ReactionSelector setReaction={setReactions} />
          )}

          <LiveCursors />

          <Comments fabricRef={fabricRef} />
        </ContextMenuTrigger>

        <ContextMenuContent className="right-menu-content bg-background">
          {shortcuts.map((item) => (
            <ContextMenuItem
              key={item.key}
              className="right-menu-item hover:bg-gray-600 duration-200 cursor-pointer"
              onClick={() => handleContextMenuClick(item.name)}
            >
              <p className="text-secondary mr-2 ">{item.name}</p>
              <p className="text-xs text-primary">{item.shortcut}</p>
            </ContextMenuItem>
          ))}
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
};

export default Live;
