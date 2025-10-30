"use client";

import { useMemo, useState, useEffect, useRef } from "react";

import { generateRandomName } from "@/lib/utils";

import Avatar from "./Avatar";
import { useOthers, useSelf } from "@liveblocks/react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { getUserProfileByIdOrEmail, UserProfile } from "@/lib/profileService";

const ActiveUsers = () => {
  /**
   * useOthers returns the list of other users in the room.
   *
   * useOthers: https://liveblocks.io/docs/api-reference/liveblocks-react#useOthers
   */
  const others = useOthers();

  /**
   * useSelf returns the current user details in the room
   *
   * useSelf: https://liveblocks.io/docs/api-reference/liveblocks-react#useSelf
   */
  const currentUser = useSelf();

  // Get the current user's profile for profile picture
  const { profile } = useUserProfile();

  // State to store profiles of other users
  const [otherUserProfiles, setOtherUserProfiles] = useState<
    Map<string, UserProfile>
  >(new Map());
  // Ref to track which profiles are currently being fetched to avoid race conditions
  const fetchingProfilesRef = useRef<Set<string>>(new Set());

  // Create a stable reference to current profiles to avoid infinite loops
  const currentProfilesRef = useRef<Map<string, UserProfile>>(new Map());

  // Update the ref whenever profiles change
  useEffect(() => {
    currentProfilesRef.current = otherUserProfiles;
  }, [otherUserProfiles]);

  // Fetch profiles for other users when the others list changes
  useEffect(() => {
    const fetchOtherProfiles = async () => {
      // Only fetch profiles for users we haven't fetched yet and aren't currently fetching
      const usersToFetch = others.filter(
        ({ id }) =>
          id &&
          !currentProfilesRef.current.has(id) &&
          !fetchingProfilesRef.current.has(id)
      );

      if (usersToFetch.length === 0) return;

      // Mark these users as being fetched
      usersToFetch.forEach(({ id }) => {
        if (id) fetchingProfilesRef.current.add(id);
      });

      try {
        const results = await Promise.all(
          usersToFetch.map(async ({ id }) => {
            try {
              const profile = await getUserProfileByIdOrEmail(id!);
              return { id: id!, profile };
            } catch (error) {
              console.error(`Error fetching profile for ${id}:`, error);
              return { id: id!, profile: null };
            }
          })
        );

        // Update profiles
        setOtherUserProfiles((prevProfiles) => {
          const newProfiles = new Map(prevProfiles);
          results.forEach((result) => {
            if (result && result.profile) {
              newProfiles.set(result.id, result.profile);
            }
          });
          return newProfiles;
        });
      } finally {
        // Clean up fetching set
        usersToFetch.forEach(({ id }) => {
          if (id) fetchingProfilesRef.current.delete(id);
        });
      }
    };

    fetchOtherProfiles();
  }, [others]);

  // memoize the result of this function so that it doesn't change on every render but only when there are new users joining the room
  const memoizedUsers = useMemo(() => {
    const hasMoreUsers = others.length > 2;

    return (
      <div className="flex items-center justify-center gap-1 z-50">
        {currentUser && (
          <Avatar
            name="You"
            otherStyles="border-[2px] border-white !h-11 !w-11"
            profilePictureUrl={profile?.profilePictureUrl}
            userId={profile?.uid}
          />
        )}

        {others.slice(0, 2).map(({ connectionId, id }) => {
          const userProfile = id ? otherUserProfiles.get(id) : null;
          const displayName =
            userProfile?.displayName ||
            userProfile?.email?.split("@")[0] ||
            id ||
            generateRandomName();

          return (
            <Avatar
              key={connectionId}
              name={displayName}
              otherStyles="-ml-3"
              profilePictureUrl={userProfile?.profilePictureUrl}
              userId={id || connectionId.toString()}
            />
          );
        })}

        {hasMoreUsers && (
          <div className="z-10 -ml-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary-black">
            +{others.length - 2}
          </div>
        )}
      </div>
    );
  }, [
    currentUser,
    others,
    profile?.profilePictureUrl,
    profile?.uid,
    otherUserProfiles,
  ]);

  return memoizedUsers;
};

export default ActiveUsers;
