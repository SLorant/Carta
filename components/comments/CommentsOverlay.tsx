"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { ThreadData } from "@liveblocks/client";
import { fabric } from "fabric";

import {
  ThreadMetadata,
  useEditThreadMetadata,
  useThreads,
} from "@/liveblocks.config";
import { useMaxZIndex } from "@/lib/useMaxZIndex";
import {
  findThreadAnchor,
  getThreadAnchorScreenPosition,
  createThreadAnchor,
  cleanupOrphanedAnchors,
} from "@/lib/threadAnchors";

import { PinnedThread } from "./PinnedThread";

type OverlayThreadProps = {
  thread: ThreadData<ThreadMetadata>;
  maxZIndex: number;
  fabricRef: React.MutableRefObject<fabric.Canvas | null>;
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

  // Ensure anchors exist for all threads and clean up orphaned ones
  useEffect(() => {
    if (!fabricRef.current || threads.length === 0) return;

    const canvas = fabricRef.current;
    const currentThreadIds = threads.map((thread) => thread.id);

    // Clean up orphaned anchors first
    cleanupOrphanedAnchors(canvas, currentThreadIds);

    // Create missing anchors for existing threads
    threads.forEach((thread) => {
      if (!thread.metadata.resolved && !findThreadAnchor(canvas, thread.id)) {
        const metadata = thread.metadata as ThreadMetadata;
        if (metadata.x !== undefined && metadata.y !== undefined) {
          createThreadAnchor(canvas, thread.id, metadata.x, metadata.y);
        }
      }
    });
  }, [threads, fabricRef]);

  return (
    <div>
      {threads
        .filter((thread) => !thread.metadata.resolved)
        .map((thread) => (
          <OverlayThread
            key={thread.id}
            thread={thread}
            maxZIndex={maxZIndex}
            fabricRef={fabricRef}
          />
        ))}
    </div>
  );
};

const OverlayThread = ({
  thread,
  maxZIndex,
  fabricRef,
}: OverlayThreadProps) => {
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

  // Force re-render when canvas transforms change or anchors are initialized
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const handleViewportChange = () => {
      forceUpdate((prev) => prev + 1);
    };

    // Listen for canvas transformation events
    canvas.on("after:render", handleViewportChange);
    canvas.on("mouse:wheel", handleViewportChange);
    canvas.on("mouse:up", handleViewportChange);

    return () => {
      canvas.off("after:render", handleViewportChange);
      canvas.off("mouse:wheel", handleViewportChange);
      canvas.off("mouse:up", handleViewportChange);
    };
  }, [fabricRef]);

  // Force re-render when thread changes (to pick up newly created anchors)
  useEffect(() => {
    forceUpdate((prev) => prev + 1);
  }, [thread.id]);

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

  // Get the screen position from the thread anchor
  const getScreenPosition = (): { x: number; y: number } => {
    if (!fabricRef.current) {
      return { x: thread.metadata.x, y: thread.metadata.y };
    }

    const anchor = findThreadAnchor(fabricRef.current, thread.id);
    if (anchor) {
      return getThreadAnchorScreenPosition(fabricRef.current, anchor);
    }

    // If no anchor exists, try to create one immediately for existing threads
    const metadata = thread.metadata as ThreadMetadata;
    if (metadata.x !== undefined && metadata.y !== undefined) {
      const newAnchor = createThreadAnchor(
        fabricRef.current,
        thread.id,
        metadata.x,
        metadata.y
      );
      return getThreadAnchorScreenPosition(fabricRef.current, newAnchor);
    }

    // Final fallback to stored coordinates
    return { x: thread.metadata.x, y: thread.metadata.y };
  };

  // Check if thread is within canvas bounds
  const isThreadVisible = (): boolean => {
    if (!fabricRef.current) return true;

    const canvas = fabricRef.current;
    const canvasElement = canvas.getElement();
    const canvasRect = canvasElement.getBoundingClientRect();
    const screenPosition = getScreenPosition();

    return (
      screenPosition.x > canvasRect.left &&
      screenPosition.x < canvasRect.right &&
      screenPosition.y > canvasRect.top &&
      screenPosition.y < canvasRect.bottom
    );
  };

  const screenPosition = getScreenPosition();
  const isVisible = isThreadVisible();

  // Don't render the thread if it's outside the canvas bounds
  if (!isVisible) {
    return null;
  }

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
