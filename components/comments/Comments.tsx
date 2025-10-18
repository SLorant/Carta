"use client";

import { ClientSideSuspense } from "@liveblocks/react";
import { fabric } from "fabric";

import { CommentsOverlay } from "@/components/comments/CommentsOverlay";

type CommentsProps = {
  fabricRef: React.MutableRefObject<fabric.Canvas | null>;
};

export const Comments = ({ fabricRef }: CommentsProps) => (
  <ClientSideSuspense fallback={null}>
    {() => <CommentsOverlay fabricRef={fabricRef} />}
  </ClientSideSuspense>
);
