"use client";

import { useMemo, useState } from "react";
import { ThreadData } from "@liveblocks/client";
import { Thread } from "@liveblocks/react-ui";

import { ThreadMetadata } from "@/liveblocks.config";
import { useUserProfile } from "@/hooks/useUserProfile";
import Avatar from "../users/Avatar";

type Props = {
  thread: ThreadData<ThreadMetadata>;
  onFocus: (threadId: string) => void;
};

export const PinnedThread = ({ thread, onFocus, ...props }: Props) => {
  // Open pinned threads that have just been created
  const startMinimized = useMemo(
    () => Number(new Date()) - Number(new Date(thread.createdAt)) > 100,
    [thread]
  );

  const [minimized, setMinimized] = useState(startMinimized);
  const { profile } = useUserProfile();

  /**
   * memoize the result of this function so that it doesn't change on every render but only when the thread changes
   * Memo is used to optimize performance and avoid unnecessary re-renders.
   *
   * useMemo: https://react.dev/reference/react/useMemo
   */

  const memoizedContent = useMemo(
    () => (
      <div
        className="absolute flex cursor-pointer gap-4"
        {...props}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
          onFocus(thread.id);

          // check if click is on/in the composer
          if (
            e.target &&
            (e.target as HTMLElement).classList.contains("lb-icon") &&
            (e.target as HTMLElement).classList.contains("lb-button-icon")
          ) {
            return;
          }

          setMinimized(!minimized);
        }}
      >
        <div
          className="relative flex h-9 w-9 select-none items-center justify-center rounded-bl-full rounded-br-full rounded-tl-md rounded-tr-full bg-white shadow"
          data-draggable={true}
        >
          <Avatar
            name="You"
            otherStyles="border-[3px] border-white cursor-pointer"
            profilePictureUrl={profile?.profilePictureUrl}
            userId={profile?.uid}
          />
        </div>
        {!minimized ? (
          <div className="flex min-w-60 flex-col overflow-hidden rounded-lg bg-white text-sm shadow">
            <Thread
              className="bg-black text-primary"
              thread={thread}
              indentCommentContent={false}
              onKeyUp={(e) => {
                e.stopPropagation();
              }}
            />
          </div>
        ) : null}
      </div>
    ),
    [thread.comments.length, minimized]
  );

  return <>{memoizedContent}</>;
};
