"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { Room } from "@/app/Room";
import { EditorCanvas } from "@/components/editor/EditorCanvas";

function EditorContent() {
  return <EditorCanvas />;
}

export default function Editor() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId") || "default-room";

  return (
    <Room roomId={roomId}>
      <EditorContent />
    </Room>
  );
}
