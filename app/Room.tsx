"use client";

import { ReactNode } from "react";
import { RoomProvider, ClientSideSuspense } from "@liveblocks/react/suspense";
import { LiveMap } from "@liveblocks/client";
import { useAuth } from "@/components/AuthProvider";
import LoadingScreen from "@/components/LoadingScreen";

interface RoomProps {
  children: ReactNode;
  roomId: string;
}

export function Room({ children, roomId }: RoomProps) {
  const { user } = useAuth();

  if (!user) {
    return <LoadingScreen message="Please log in to access this room." />;
  }

  // With ID token authentication, Liveblocks handles permission checking automatically
  // No need to check permissions here - Liveblocks will handle room access control
  return (
    <RoomProvider
      id={roomId}
      initialPresence={{
        cursor: null,
        cursorColor: null,
        editingText: null,
      }}
      initialStorage={{ canvasObjects: new LiveMap() }}
    >
      <ClientSideSuspense
        fallback={<LoadingScreen message="Loading room..." />}
      >
        {children}
      </ClientSideSuspense>
    </RoomProvider>
  );
}
