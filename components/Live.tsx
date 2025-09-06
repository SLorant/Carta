import {
  useBroadcastEvent,
  useEventListener,
  useMyPresence,
  useOthers,
} from "@liveblocks/react";
import LiveCursors from "./cursor/LiveCursors";
import React, { useCallback, useEffect, useState } from "react";
import CursorChat from "./cursor/CursorChat";
import {
  CursorMode,
  CursorState,
  Presence,
  Reaction,
  ReactionEvent,
} from "@/types/type";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase.config";
import ReactionSelector from "./reaction/ReactionButton";
import FlyingReaction from "./reaction/FlyingReaction";
import useInterval from "@/hooks/useInterval";
import ActiveUsers from "./users/ActiveUsers";
import { shapeElements } from "@/constants";
import ShapesMenu from "./ShapesMenu";
import { NewThread } from "./comments/NewThread";

type Props = {
  canvasRef: React.RefObject<HTMLCanvasElement>;
};

const Live = ({ canvasRef }: Props) => {
  const router = useRouter();
  const [userName, setUserName] = React.useState("");

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        const uid = user.uid;
        setUserName(user.email ?? "");
        console.log("uid", uid);
      } else {
        console.log("user is logged out");
      }
    });
  }, []);

  const others = useOthers();
  const [{ cursor }, updateMyPresence]: Presence & {
    cursor: { x: number; y: number } | null;
  } = useMyPresence();
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
      setReaction((reactions) =>
        reactions.concat([
          {
            point: { x: cursor.x, y: cursor.y },
            value: cursorState.reaction,
            timestamp: Date.now(),
          },
        ])
      );

      broadcast({
        x: cursor.x,
        y: cursor.y,
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

      setCursorState((state: CursorState) =>
        state.mode === CursorMode.Reaction
          ? { ...state, isPressed: true }
          : state
      );
    },
    [cursorState.mode, setCursorState]
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent) => {
      setCursorState((state: CursorState) =>
        cursorState.mode === CursorMode.Reaction
          ? { ...state, isPressed: true }
          : state
      );
    },
    [cursorState.mode, setCursorState]
  );

  useEffect(() => {
    const onKeyUp = (event: KeyboardEvent) => {
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
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "/") {
        event.preventDefault();
      }
    };

    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [updateMyPresence]);

  const setReactions = useCallback((reaction: string) => {
    setCursorState({ mode: CursorMode.Reaction, reaction, isPressed: false });
  }, []);

  const toolbarActions = [
    {
      icon: "cursor.svg",
      name: "Cursor",
      onClick: () => {},
      value: "select",
    },
    {
      icon: "brush.svg",
      name: "brush",
      onClick: () => {},
      value: shapeElements,
    },
    {
      icon: "text.svg",
      name: "Text",
      onClick: () => {},
      value: "text",
    },
    {
      icon: "path.svg",
      name: "Path",
      onClick: () => {},
      value: "delete",
    },
    {
      icon: "castle.svg",
      name: "Castle",
      onClick: () => {},
      value: "reset",
    },
    {
      icon: "wand.svg",
      name: "Wand",
      onClick: () => {},
      value: "comments",
    },
  ];

  return (
    <div className="overflow-hidden relative w-screen h-screen">
      {/*       <div
        className="absolute top-0 left-0 z-20 w-screen min-h-screen h-full"
        style={{
          background:
            "linear-gradient(90deg,rgba(0, 0, 0, 0.5) 0%, rgba(255, 255, 255, 0) 50%, rgba(0, 0, 0, 0.5) 100%)",
        }}
      ></div>
      <div
        className="absolute top-0 left-0 z-20 w-screen min-h-screen h-full"
        style={{
          background:
            "linear-gradient(180deg,rgba(0, 0, 0, 0.5) 0%, rgba(255, 255, 255, 0) 50%, rgba(0, 0, 0, 0) 100%)",
        }}
      ></div> */}
      <section className="absolute border-r-2 border-black top-20 left-0 bg-black/25 w-20 h-full z-50">
        <div className="w-full flex flex-col items-center justify-center h-16 p-2 border-b-5 border-gray-400">
          <h2 className="text-primary text-3xl">TOOLS</h2>
        </div>
        {toolbarActions.map((action, index) => (
          <div
            key={index}
            className="w-full flex flex-col items-center justify-center h-18 p-2 border-b-5 border-gray-400"
            onClick={action.onClick}
          >
            {/*    {Array.isArray(action.value) ? (
              <ShapesMenu />
            ) : action.value === "comments" ? (
              <NewThread></NewThread>
            ) : (
              <img
                className="w-10  cursor-pointer"
                src={action.icon}
                alt={action.name}
              />
            )} */}
          </div>
        ))}
      </section>
      <section className="absolute border-l-2 border-black top-20 right-0 bg-black/0 w-60 h-full z-50">
        <div className="w-full flex flex-col items-start pl-6 justify-center h-20 p-2 border-b-5 border-gray-400">
          <ActiveUsers />

          <img src="profiles.png" className="" alt="" />
        </div>
        <div className="w-full flex  items-center pl-6 justify-between h-18 p-2 border-b-5 border-gray-400">
          <h2 className="text-primary text-3xl">LAYERS</h2>/
          <img src="arrow.svg" className="w-10 mt-1 rotate-270" alt="" />
        </div>
        <div className="w-full flex  items-center pl-6 justify-between h-18 p-2 border-b-5 border-gray-400">
          <h2 className="text-primary text-3xl">SETTINGS</h2>
          <img src="arrow.svg" className="w-10 mt-1 rotate-270" alt="" />
        </div>
        <div className="w-full flex flex-col items-between bg-black/25  justify-between h-96  border-b-5 border-gray-400">
          <div className="flex items-center justify-between w-full pl-6 p-2">
            <h2 className="text-primary text-3xl">CHAT</h2>
            <img src="arrow.svg" className="w-10 mt-1 rotate-0" alt="" />
          </div>
          <div className="flex flex-col  items-center justify-between w-full">
            <div className="flex bg-zinc-600/50 w-full h-10 mb-4">
              <p className="text-primary mt-2 ml-4">User VKI:</p>
              <p className="text-white mt-3 ml-2 text-sm">Valami szoveg</p>
            </div>
            <div className="mt-2 border-2 border-secondary rounded-lg w-[90%] h-10"></div>
            <div className="pr-4 pb-4 justify-end flex w-full ">
              <button className="mt-4 text-lg bg-primary text-background p-2 rounded-md h-8 flex justify-center items-center w-16 cursor-pointer">
                Send
              </button>
            </div>
          </div>
        </div>
      </section>
      <div
        className="z-40 px-60 pt-28 relative w-screen h-full flex flex-col items-center justify-start"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        id="canvas"
      >
        <div className="absolute px-10 bg-black/10 border-b-2 pb-4 border-black top-0 pt-2 w-full h-20 flex justify-between text-secondary ">
          <button
            className="text-4xl text-secondary cursor-pointer opacity-50"
            onClick={() => router.push("/")}
          >
            CARTA
          </button>
          <button
            className="text-4xl cursor-pointer underline"
            onClick={() => router.push("/profile")}
          >
            {userName}
          </button>
        </div>

        <canvas ref={canvasRef} className=" w-full h-full" />
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
            cursor={cursor}
            cursorState={cursorState}
            setCursorState={setCursorState}
            updateMyPresence={updateMyPresence}
          />
        )}
        {cursorState.mode === CursorMode.ReactionSelector && (
          <ReactionSelector setReaction={setReactions} />
        )}

        <LiveCursors others={others} />
      </div>
    </div>
  );
};

export default Live;
