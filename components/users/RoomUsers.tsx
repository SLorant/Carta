"use client";

import React, { useMemo, useState, useEffect } from "react";
import { MapRoom } from "@/lib/roomService";
import Avatar from "./Avatar";
import { getUserProfileByIdOrEmail, UserProfile } from "@/lib/profileService";

interface RoomUsersProps {
  room: MapRoom;
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

const RoomUsers = ({ room, onClick }: RoomUsersProps) => {
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Get all user IDs from room permissions
  const userIds = useMemo(() => {
    const ids = new Set<string>();

    // Add the room creator
    ids.add(room.createdBy);

    // Add all users with permissions
    room.permissions.forEach((permission) => {
      ids.add(permission.userId);
    });

    return Array.from(ids);
  }, [room]);

  // Fetch user profiles
  useEffect(() => {
    const fetchUserProfiles = async () => {
      try {
        setLoading(true);
        const profiles = await Promise.all(
          userIds.map(async (userId) => {
            try {
              // Try to get profile by UID or email
              let profile = await getUserProfileByIdOrEmail(userId);

              // If not found, create a basic profile for emails
              if (!profile && userId.includes("@")) {
                profile = {
                  uid: userId,
                  email: userId,
                  displayName: userId.split("@")[0],
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };
              }

              return profile;
            } catch (error) {
              console.error(`Error fetching profile for ${userId}:`, error);
              // Return a fallback profile for emails
              if (userId.includes("@")) {
                return {
                  uid: userId,
                  email: userId,
                  displayName: userId.split("@")[0],
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };
              }
              return null;
            }
          })
        );

        // Filter out null profiles
        setUserProfiles(
          profiles.filter(
            (p: UserProfile | null): p is UserProfile => p !== null
          )
        );
      } catch (error) {
        console.error("Error fetching user profiles:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userIds.length > 0) {
      fetchUserProfiles();
    } else {
      setLoading(false);
    }
  }, [userIds]);

  const displayUsers = useMemo(() => {
    if (loading) {
      return (
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 rounded-full bg-gray-300 animate-pulse" />
          <div className="w-6 h-6 rounded-full bg-gray-300 animate-pulse -ml-1" />
        </div>
      );
    }

    const maxVisible = 4;
    const visibleUsers = userProfiles.slice(0, maxVisible - 1);
    const remainingCount = userProfiles.length - visibleUsers.length;

    return (
      <>
        {visibleUsers.map((user, index) => (
          <Avatar
            key={user.uid}
            name={user.displayName || user.email.split("@")[0]}
            otherStyles={`${index > 0 ? "-ml-1" : ""} border-2 border-white`}
            profilePictureUrl={user.profilePictureUrl}
            userId={user.uid}
          />
        ))}

        {remainingCount > 0 ||
          (userProfiles.length < 4 && (
            <button
              className="cursor-pointer w-10 h-10 flex items-center justify-center rounded-full bg-gray-600 text-white text-md"
              onClick={onClick}
            >
              +
            </button>
          ))}
      </>
    );
  }, [userProfiles, loading, onClick]);

  return displayUsers;
};

export default RoomUsers;
