"use client";

import { auth } from "@/firebase.config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const Profile = () => {
  const router = useRouter();
  const [userName, setUserName] = React.useState("");

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // https://firebase.google.com/docs/reference/js/firebase.User
        const uid = user.uid;
        setUserName(user.email ?? "");
        console.log("uid", uid);
      } else {
        console.log("user is logged out");
      }
    });
  }, []);

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
            {userName}
          </button>
        </div>
        <div className="flex  items-center justify-between w-full ">
          <h1 className="text-primary text-9xl">Profile</h1>
          <div className="flex gap-8 mb-8">
            <button
              className="px-8 pt-1 pb-3 bg-primary text-4xl rounded-lg text-background mt-20 cursor-pointer"
              onClick={() => router.push("/maps")}
            >
              Go to your Maps
            </button>
          </div>
        </div>
        <div className="flex w-full h-full mt-20">
          <div className="w-full h-[300px] bg-black/15 rounded-[20px] border border-black flex justify-start items-center drop-shadow-lg">
            <div className="ml-20 rounded-full bg-emerald-800 w-52 h-52"></div>
            <div className=" ml-10 flex flex-col text-secondary">
              <h2 className="text-4xl underline"> {userName}</h2>
              <p className="mt-2 text-lg">User bio and other info</p>
            </div>
            <button
              className="absolute top-8 right-8 px-8 pt-1 pb-2 bg-secondary text-4xl rounded-lg text-background cursor-pointer"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
