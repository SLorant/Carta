"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { RoomService, MapRoom } from "@/lib/roomService";
import { CreateRoomModal } from "@/components/CreateRoomModal";
import { InviteModal } from "@/components/InviteModal";

const Maps = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [userRooms, setUserRooms] = useState<MapRoom[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<MapRoom | null>(null);

  const loadUserRooms = React.useCallback(async () => {
    if (user) {
      try {
        const userId = user.email || user.uid;
        const idToken = await user.getIdToken();
        
        // Use the new method that fetches from both local and server
        const allUserRooms = await RoomService.getAllUserRooms(userId, idToken);
        setUserRooms(allUserRooms);
      } catch (error) {
        console.error("Error loading user rooms:", error);
        
        // Fallback to local rooms only
        const roomsByUid = RoomService.getUserRooms(user.uid);
        const roomsByEmail = user.email ? RoomService.getUserRoomsByEmail(user.email) : [];
        
        // Combine and deduplicate rooms
        const allUserRooms = [...roomsByUid, ...roomsByEmail];
        const uniqueRooms = allUserRooms.filter((room, index, self) => 
          index === self.findIndex(r => r.id === room.id)
        );
        
        setUserRooms(uniqueRooms);
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadUserRooms();
    }
  }, [user, loadUserRooms]);

  const handleRoomCreated = () => {
    loadUserRooms();
  };

  const handleRoomClick = (roomId: string) => {
    router.push(`/editor?roomId=${roomId}`);
  };

  const handleInviteClick = (e: React.MouseEvent, room: MapRoom) => {
    e.stopPropagation(); // Prevent triggering the room click
    setSelectedRoom(room);
    setShowInviteModal(true);
  };

  const handleInviteSent = () => {
    loadUserRooms(); // Refresh the rooms list
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    router.push("/");
    return null;
  }

  return (
    <div>
      <div
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
      ></div>
      <div className="z-40 px-60 pt-28 relative w-screen h-full flex flex-col items-center justify-start">
        <div className="absolute px-60 top-6 w-full flex justify-between text-secondary ">
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
            {user.email}
          </button>
        </div>
        <div className="flex  items-center justify-between w-full ">
          <h1 className="text-primary text-9xl">Your Maps</h1>
          <div className="flex gap-8 mb-8">
            <button className="px-8 pt-1 pb-3 bg-secondary text-4xl rounded-lg text-background mt-20">
              Import
            </button>
            <button
              className="px-8 pt-1 pb-3 bg-primary text-4xl rounded-lg text-background mt-20"
              onClick={() => setShowCreateModal(true)}
            >
              Create new
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-10 w-full h-full mt-20">
          {userRooms.map((room) => (
            <div
              key={room.id}
              className="relative w-[350px] h-[300px] rounded-[20px] drop-shadow-lg cursor-pointer group"
              onClick={() => handleRoomClick(room.id)}
            >
              <Image
                src={room.imageUrl}
                className="absolute w-full h-full top-0 left-0 opacity-70 rounded-[20px] brightness-75"
                alt={room.name}
                fill
                style={{ objectFit: "cover" }}
              />
              
              {/* Invite button - only show for room owners */}
              {user && RoomService.getUserPermission(room.id, user.email || user.uid) === "owner" && (
                <button
                  onClick={(e) => handleInviteClick(e, room)}
                  className="absolute top-4 right-4 bg-primary text-background px-3 py-1 rounded-md text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/90"
                  title="Invite collaborators"
                >
                  Invite
                </button>
              )}
              
              <div
                className="px-4 absolute bottom-0 bg-black/50 rounded-b-[20px] text-secondary left-0 w-full h-2/5 flex flex-col items-start justify-center"
                style={{ textShadow: "1px 1px 2px black" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-4xl underline">{room.name}</h2>
                  {room.permissions.length > 1 && (
                    <span className="text-xs bg-primary text-background px-2 py-1 rounded-full">
                      Shared
                    </span>
                  )}
                </div>
                <p className="mb-4 pr-36 text-sm">{room.description}</p>
                {user && RoomService.getUserPermission(room.id, user.email || user.uid) !== "owner" && (
                  <p className="text-xs opacity-75">
                    {RoomService.getUserPermission(room.id, user.email || user.uid) === "editor" ? "Can edit" : "View only"}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Create new room card */}
          <div
            className="w-[350px] h-[300px] bg-black/15 rounded-[20px] border border-black flex justify-center items-center drop-shadow-lg cursor-pointer hover:bg-black/20 transition-colors"
            onClick={() => setShowCreateModal(true)}
          >
            <p
              className="text-9xl text-primary mb-2 mr-1"
              style={{ fontFamily: "jaini, sans-serif" }}
            >
              +
            </p>
          </div>
        </div>
      </div>

      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onRoomCreated={handleRoomCreated}
      />

      {selectedRoom && (
        <InviteModal
          isOpen={showInviteModal}
          onClose={() => {
            setShowInviteModal(false);
            setSelectedRoom(null);
          }}
          room={selectedRoom}
          onInviteSent={handleInviteSent}
        />
      )}
    </div>
  );
};

export default Maps;
