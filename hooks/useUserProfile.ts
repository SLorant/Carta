import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/firebase.config";
import {
  getUserProfile,
  saveUserProfile,
  uploadProfilePicture,
  updateProfilePictureUrl,
  deleteProfilePicture,
  removeProfilePictureUrl,
  UserProfile,
} from "@/lib/profileService";

export function useUserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.uid);
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          let userProfile = await getUserProfile(firebaseUser.uid);

          // Create profile if it doesn't exist
          if (!userProfile) {
            console.log("Creating new user profile for:", firebaseUser.uid);
            userProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              username: "",
              displayName: firebaseUser.displayName || "",
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            await saveUserProfile(userProfile);
            console.log("New user profile created");
          }

          setProfile(userProfile);
        } catch (error) {
          console.error("Error loading user profile:", error);
          // Even if profile loading fails, we can still show basic user info
          if (firebaseUser.email) {
            const basicProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              username: "",
              displayName: firebaseUser.displayName || "",
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            setProfile(basicProfile);
            // Try to save the basic profile
            try {
              await saveUserProfile(basicProfile);
            } catch (saveError) {
              console.error("Error saving basic profile:", saveError);
            }
          }
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateProfilePicture = async (file: File): Promise<void> => {
    if (!user || !profile) throw new Error("User not authenticated");

    setUploading(true);
    try {
      // Delete old profile picture if it exists
      if (profile.profilePictureUrl) {
        await deleteProfilePicture(profile.profilePictureUrl);
      }

      // Upload new profile picture
      const downloadURL = await uploadProfilePicture(user.uid, file);

      // Update profile with new URL
      await updateProfilePictureUrl(user.uid, downloadURL);

      // Update local state
      setProfile((prev) =>
        prev ? { ...prev, profilePictureUrl: downloadURL } : null
      );
    } catch (error) {
      console.error("Error updating profile picture:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const removeProfilePicture = async (): Promise<void> => {
    if (!user || !profile) throw new Error("User not authenticated");

    setUploading(true);
    try {
      // Delete profile picture from storage
      if (profile.profilePictureUrl) {
        await deleteProfilePicture(profile.profilePictureUrl);
      }

      // Remove URL from profile
      await removeProfilePictureUrl(user.uid);

      // Update local state
      setProfile((prev) =>
        prev ? { ...prev, profilePictureUrl: undefined } : null
      );
    } catch (error) {
      console.error("Error removing profile picture:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const updateProfile = async (
    updates: Partial<UserProfile>
  ): Promise<void> => {
    if (!user || !profile) throw new Error("User not authenticated");

    try {
      const updatedProfile = { ...profile, ...updates };
      await saveUserProfile(updatedProfile);
      setProfile(updatedProfile);
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  return {
    user,
    profile,
    loading,
    uploading,
    updateProfilePicture,
    removeProfilePicture,
    updateProfile,
  };
}
