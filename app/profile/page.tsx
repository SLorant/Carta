"use client";

import { auth } from "@/firebase.config";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import React from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";
import BackgroundBlur from "@/components/BackgroundBlur";
import Header from "@/components/Header";
import { CancelButton, PrimaryButton } from "@/components/general/Button";
import { TextInput } from "@/components/inputs/TextInput";

const Profile = () => {
  const router = useRouter();
  const {
    user,
    profile,
    loading,
    uploading,
    updateProfilePicture,
    removeProfilePicture,
    updateProfile,
  } = useUserProfile();
  
  const [isEditingUsername, setIsEditingUsername] = React.useState(false);
  const [tempUsername, setTempUsername] = React.useState("");

  // Initialize temp username when profile loads
  React.useEffect(() => {
    if (profile?.username) {
      setTempUsername(profile.username);
    }
  }, [profile?.username]);

  // Redirect to home if not authenticated
  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [loading, user, router]);

  const handleSaveUsername = async () => {
    if (tempUsername.trim() && updateProfile) {
      try {
        await updateProfile({ username: tempUsername.trim() });
        setIsEditingUsername(false);
      } catch (error) {
        console.error("Error updating username:", error);
      }
    }
  };

  const handleCancelEdit = () => {
    setTempUsername(profile?.username || "");
    setIsEditingUsername(false);
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        // Sign-out successful.
        router.push("/");
        console.log("Signed out successfully");
      })
      .catch((error) => {
        console.log("Error signing out", error);
      });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-4xl text-primary">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to home
  }

  return (
    <div>
      <BackgroundBlur />
      <div className="z-40 px-72 pt-28 relative w-screen h-full flex flex-col items-center justify-start">
        <Header user={user} />
        <div className="flex  items-center justify-between w-full ">
          <h1 className="text-primary text-7xl">Profile</h1>
          <div className="flex gap-8 mb-8">
            <PrimaryButton
              className="mt-16 !text-2xl "
              onClick={() => router.push("/maps")}
            >
              Go to your Maps
            </PrimaryButton>
          </div>
        </div>
        <div className="flex w-full h-full mt-20">
          <div className="w-full h-[300px] bg-black/15 rounded-[20px] border border-black flex justify-start items-center drop-shadow-lg">
            <div className="ml-20">
              {loading ? (
                <div className="w-52 h-52 rounded-full bg-gray-300 animate-pulse"></div>
              ) : (
                <ProfilePictureUpload
                  currentPictureUrl={profile?.profilePictureUrl}
                  onUpload={updateProfilePicture}
                  onRemove={removeProfilePicture}
                  uploading={uploading}
                  size="lg"
                />
              )}
            </div>
            <div className=" ml-10 flex flex-col text-secondary">
              <div className="flex items-center gap-4">
                {isEditingUsername ? (
                  <div className="flex items-center gap-2">
                    <TextInput
                      label=""
                      value={tempUsername}
                      onChange={(e) => setTempUsername(e.target.value)}
                      placeholder="Enter username"
                      className="w-64"
                      inputClassName="text-2xl"
                    />
                    <button
                      onClick={handleSaveUsername}
                      className="text-green-500 hover:text-green-400 text-lg px-2"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="text-red-500 hover:text-red-400 text-lg px-2"
                    >
                      ✗
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-4xl underline">
                      {profile?.username || "Set Username"}
                    </h2>
                    <button
                      onClick={() => setIsEditingUsername(true)}
                      className="text-secondary hover:text-primary text-lg px-2"
                    >
                      ✏️
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-2 text-lg">
                {profile?.email || "Loading..."}
              </p>
              <p className="mt-2 text-lg">
                {profile?.bio || "User bio and other info"}
              </p>
            </div>
            <CancelButton
              className="absolute bottom-8 right-8  text-4xl "
              onClick={handleLogout}
            >
              Logout
            </CancelButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
