"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { RoomService, MapRoom } from "@/lib/roomService";
import { CreateRoomModal } from "@/components/CreateRoomModal";
import InviteModal from "@/components/InviteModal";
import { EditMapModal } from "@/components/EditMapModal";
import { PrimaryButton } from "@/components/general/Button";
import BackgroundBlur from "@/components/BackgroundBlur";
import Header from "@/components/Header";
import RoomUsers from "@/components/users/RoomUsers";
import LoadingScreen from "@/components/LoadingScreen";

const Maps = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [userRooms, setUserRooms] = useState<MapRoom[]>([]);
  const [mapsLoading, setMapsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<MapRoom | null>(null);

  const loadUserRooms = React.useCallback(async () => {
    if (user) {
      setMapsLoading(true);
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
        const roomsByEmail = user.email
          ? RoomService.getUserRoomsByEmail(user.email)
          : [];

        // Combine and deduplicate rooms
        const allUserRooms = [...roomsByUid, ...roomsByEmail];
        const uniqueRooms = allUserRooms.filter(
          (room, index, self) =>
            index === self.findIndex((r) => r.id === room.id)
        );

        setUserRooms(uniqueRooms);
      } finally {
        setMapsLoading(false);
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

  const handleEditClick = (e: React.MouseEvent, room: MapRoom) => {
    e.stopPropagation(); // Prevent triggering the room click
    setSelectedRoom(room);
    setShowEditModal(true);
  };

  const handleInviteSent = () => {
    loadUserRooms(); // Refresh the rooms list
  };

  const handleMapUpdated = async () => {
    await loadUserRooms(); // Refresh the rooms list
  };

  if (loading) {
    return <LoadingScreen message="Loading your maps..." />;
  }

  if (!user) {
    router.push("/");
    return null;
  }

  return (
    <div>
      <BackgroundBlur />
      <div className="z-40 px-4 md:px-32 lg:px-60 xl:px-40 2xl:px-72 pt-20 relative w-screen h-full flex flex-col items-center justify-start">
        <Header
          user={user}
          className="px-10 md:px-32 lg:px-60 xl:px-40 2xl:px-72"
        />
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between w-full my-4 gap-4 md:gap-0">
          <h1 className="text-primary mb-4 md:mb-0 text-5xl lg:text-6xl xl:text-7xl  text-center md:text-left">
            Your Maps
          </h1>
          <div className="flex gap-4 md:gap-8">
            <PrimaryButton
              onClick={() => setShowCreateModal(true)}
              className="mt-0 !text-lg md:!text-xl lg:!text-2xl w-28 md:w-32"
            >
              Create new
            </PrimaryButton>
          </div>
        </div>

        {/* Loading state for maps */}
        {mapsLoading ? (
          <div className="flex flex-col items-center justify-center w-full h-96 mt-8">
            <div className="relative w-16 h-16 mb-6">
              {/* Outer ring */}
              <div className="absolute inset-0 w-16 h-16 border-4 border-primary/20 rounded-full"></div>
              {/* Spinning primary ring */}
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary border-r-primary rounded-full animate-spin"></div>
              {/* Counter-spinning secondary ring */}
              <div
                className="absolute inset-2 w-12 h-12 border-4 border-transparent border-t-secondary border-l-secondary rounded-full animate-spin"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "2s",
                }}
              ></div>
              {/* Inner pulsing dot */}
              <div className="absolute inset-6 w-4 h-4 bg-primary rounded-full animate-pulse"></div>
            </div>
            <p className="text-xl md:text-2xl text-secondary animate-pulse">
              Loading your maps...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 lg:gap-10 xl:gap-12 w-full h-full mt-8">
            {userRooms.map((room) => (
              <div
                key={room.id}
                className="relative w-full max-w-[350px] h-[250px] md:h-[280px] lg:h-[300px] rounded-[20px] drop-shadow-lg group mx-auto"
              >
                <Image
                  src={room.imageUrl}
                  className="absolute w-full h-full top-0 left-0 opacity-70 rounded-[20px] cursor-pointer brightness-75"
                  alt={room.name}
                  fill
                  style={{ objectFit: "cover" }}
                  onClick={() => handleRoomClick(room.id)}
                />

                {/* Invite button - only show for room owners */}
                {user &&
                  RoomService.getUserPermission(
                    room.id,
                    user.email || user.uid
                  ) === "owner" && (
                    <div className="absolute right-2 top-2 gap-1 grid place-items-center grid-cols-2 py-1 md:py-2 mt-2 rounded-xl px-1 md:px-2 duration-300 bg-black/50 group-hover:opacity-100 opacity-0">
                      <button
                        onClick={(e) => handleInviteClick(e, room)}
                        className="cursor-pointer bg-primary text-background px-2 md:px-3 py-1 rounded-md text-xs md:text-sm transition-opacity hover:bg-secondary"
                        title="Invite collaborators"
                      >
                        Invite
                      </button>
                      <button
                        onClick={(e) => handleEditClick(e, room)}
                        className="cursor-pointer bg-primary text-background px-2 md:px-3 py-1 rounded-md text-xs md:text-sm transition-opacity hover:bg-secondary"
                      >
                        Edit
                      </button>
                    </div>
                  )}

                <div
                  className="px-2 md:px-4 absolute bottom-0 bg-black/50 rounded-b-[20px] text-secondary left-0 w-full h-2/5 flex flex-col items-start justify-center"
                  style={{ textShadow: "1px 1px 2px black" }}
                >
                  <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                    <h2
                      className="text-2xl md:text-3xl lg:text-4xl underline cursor-pointer truncate"
                      onClick={() => handleRoomClick(room.id)}
                    >
                      {room.name}
                    </h2>
                  </div>

                  <div className="absolute right-2 top-0 gap-1 md:gap-2 grid place-items-center grid-cols-2 py-1 md:py-2 mt-2 rounded-xl px-1 md:px-2 bg-black/50">
                    <RoomUsers
                      room={room}
                      onClick={(e) => handleInviteClick(e, room)}
                    />
                  </div>
                  <p className="mb-2 md:mb-4 pr-20 md:pr-36 text-xs md:text-sm line-clamp-2">
                    {room.description}
                  </p>
                  {user &&
                    RoomService.getUserPermission(
                      room.id,
                      user.email || user.uid
                    ) !== "owner" && (
                      <p className="text-xs opacity-75">
                        {RoomService.getUserPermission(
                          room.id,
                          user.email || user.uid
                        ) === "editor"
                          ? "Can edit"
                          : "View only"}
                      </p>
                    )}
                </div>
              </div>
            ))}

            {/* Create new room card */}
            <div
              className="w-full max-w-[350px] h-[250px] md:h-[280px] lg:h-[300px] bg-black/15 rounded-[20px] border border-black flex justify-center items-center drop-shadow-lg cursor-pointer hover:bg-black/20 transition-colors mx-auto"
              onClick={() => setShowCreateModal(true)}
            >
              <p
                className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl text-primary mb-2 mr-1"
                style={{ fontFamily: "jaini, sans-serif" }}
              >
                +
              </p>
            </div>
          </div>
        )}
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

      {selectedRoom && (
        <EditMapModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRoom(null);
          }}
          room={selectedRoom}
          onMapUpdated={handleMapUpdated}
        />
      )}
    </div>
  );
};

export default Maps;
