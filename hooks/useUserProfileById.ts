import { useState, useEffect } from "react";
import { getUserProfileByIdOrEmail, UserProfile } from "@/lib/profileService";

export function useUserProfileById(uid: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const userProfile = await getUserProfileByIdOrEmail(uid);
        setProfile(userProfile);
      } catch (error) {
        console.error(
          "useUserProfileById: Error fetching user profile:",
          error
        );
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [uid]);

  return { profile, loading };
}
