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
import LoadingScreen from "@/components/LoadingScreen";
import { HiOutlinePencil } from "react-icons/hi";
import { AiOutlineCloseCircle } from "react-icons/ai";
import { MdDone } from "react-icons/md";

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
        router.push("/");
      })
      .catch((error) => {
        console.error("Error signing out", error);
      });
  };

  if (loading) {
    return <LoadingScreen message="Loading profile..." />;
  }

  if (!user) {
    return null; // Will redirect to home
  }

  return (
    <div>
      <BackgroundBlur />
      <div className="z-40 px-10 lg:px-40 xl:px-72 pt-28 relative w-screen h-full flex flex-col items-center justify-start">
        <Header user={user} className="px-10 lg:px-40 xl:px-72" />
        <div className="flex  items-center justify-between w-full flex-col sm:flex-row ">
          <h1 className="text-primary text-5xl lg:text-6xl xl:text-7xl">
            Profile
          </h1>
          <div className="flex sm:gap-8 sm:mb-8">
            <PrimaryButton
              className="mt-8 sm:mt-16 !text-2xl "
              onClick={() => router.push("/maps")}
            >
              Go to your Maps
            </PrimaryButton>
          </div>
        </div>
        <div className=" h-[420px] md:h-[300px] bg-black/15 w-full md:flex-row flex-col rounded-[20px] mt-12 border border-black flex justify-start items-start md:justify-start md:items-center drop-shadow-lg">
          <div className="ml-10 sm:ml-20 mt-10 md:mt-0">
            {loading ? (
              <div className="h-40 w-40 sm:w-52 sm:h-52 rounded-full bg-gray-300 animate-pulse"></div>
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
          <div className="ml-15 sm:ml-25 mt-4 md:mt-0 md:ml-10 flex flex-col text-secondary">
            <div className="flex items-center gap-4">
              {isEditingUsername ? (
                <div className="flex items-center gap-2 md:flex-row flex-col">
                  <TextInput
                    label=""
                    value={tempUsername}
                    onChange={(e) => setTempUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-40 md:w-64"
                    inputClassName="text-base md:text-xl"
                  />
                  <div className="flex sm:gap-0 gap-4">
                    <button
                      onClick={handleSaveUsername}
                      className="text-green-500 hover:text-green-400 text-2xl mt-1 px-2 cursor-pointer"
                    >
                      <MdDone />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="text-red-500 hover:text-red-400 text-2xl mt-1 pr-2 cursor-pointer"
                    >
                      <AiOutlineCloseCircle />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl underline">
                    {profile?.username || "Set Username"}
                  </h2>
                  <button
                    onClick={() => setIsEditingUsername(true)}
                    className="text-secondary hover:text-primary text-lg px-2 cursor-pointer"
                  >
                    <HiOutlinePencil className="text-secondary text-2xl mt-2 " />
                  </button>
                </div>
              )}
            </div>
            <p className="mt-2 text-sm md:text-base lg:text-lg">
              {profile?.email || "Loading..."}
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
  );
};

export default Profile;
