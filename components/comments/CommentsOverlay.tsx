"use client";

import { useCallback, useRef } from "react";
import { ThreadData } from "@liveblocks/client";
import { fabric } from "fabric";

import {
  ThreadMetadata,
  useEditThreadMetadata,
  useThreads,
} from "@/liveblocks.config";
import { useMaxZIndex } from "@/lib/useMaxZIndex";
import { useCanvasViewport } from "@/hooks/useCanvasViewport";

import { PinnedThread } from "./PinnedThread";

type OverlayThreadProps = {
  thread: ThreadData<ThreadMetadata>;
  maxZIndex: number;
  transformCanvasToScreen: (canvasX: number, canvasY: number) => { x: number; y: number };
};

type CommentsOverlayProps = {
  fabricRef: React.MutableRefObject<fabric.Canvas | null>;
};

export const CommentsOverlay = ({ fabricRef }: CommentsOverlayProps) => {
  /**
   * We're using the useThreads hook to get the list of threads
   * in the room.
   *
   * useThreads: https://liveblocks.io/docs/api-reference/liveblocks-react#useThreads
   */
  const { threads } = useThreads();

  // get the max z-index of a thread
  const maxZIndex = useMaxZIndex();

  // Get canvas viewport transformations
  const { transformCanvasToScreen } = useCanvasViewport(fabricRef);

  return (
    <div>
      {threads
        .filter((thread) => !thread.metadata.resolved)
        .map((thread) => (
          <OverlayThread
            key={thread.id}
            thread={thread}
            maxZIndex={maxZIndex}
            transformCanvasToScreen={transformCanvasToScreen}
          />
        ))}
    </div>
  );
};

const OverlayThread = ({ thread, maxZIndex, transformCanvasToScreen }: OverlayThreadProps) => {
  /**
   * We're using the useEditThreadMetadata hook to edit the metadata
   * of a thread.
   *
   * useEditThreadMetadata: https://liveblocks.io/docs/api-reference/liveblocks-react#useEditThreadMetadata
   */
  const editThreadMetadata = useEditThreadMetadata();

  /**
   * We're using the useUser hook to get the user of the thread.
   *
   * useUser: https://liveblocks.io/docs/api-reference/liveblocks-react#useUser
   */
  /*   const { isLoading } = useUser(thread.comments[0].userId); */

  // We're using a ref to get the thread element to position it
  const threadRef = useRef<HTMLDivElement>(null);

  // If other thread(s) above, increase z-index on last element updated
  const handleIncreaseZIndex = useCallback(() => {
    if (maxZIndex === thread.metadata.zIndex) {
      return;
    }

    // Update the z-index of the thread in the room
    editThreadMetadata({
      threadId: thread.id,
      metadata: {
        zIndex: maxZIndex + 1,
      },
    });
  }, [thread, editThreadMetadata, maxZIndex]);

  // Transform the thread coordinates from canvas space to screen space
  const screenPosition = transformCanvasToScreen(thread.metadata.x, thread.metadata.y);

  return (
    <div
      ref={threadRef}
      id={`thread-${thread.id}`}
      className="absolute left-0 top-0 flex gap-5 z-50"
      style={{
        transform: `translate(${screenPosition.x}px, ${screenPosition.y}px)`,
      }}
    >
      {/* render the thread */}
      <PinnedThread thread={thread} onFocus={handleIncreaseZIndex} />
    </div>
  );
};
