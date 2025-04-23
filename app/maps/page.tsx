"use client";

import { auth } from "@/firebase.config";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const Maps = () => {
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
          <h1 className="text-primary text-9xl">Your Maps</h1>
          <div className="flex gap-8 mb-8">
            <button className="px-8 pt-1 pb-3 bg-secondary text-4xl rounded-lg text-background mt-20">
              Something
            </button>
            <button className="px-8 pt-1 pb-3 bg-primary text-4xl rounded-lg text-background mt-20">
              Create new
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-10 w-full h-full mt-20">
          <div
            className="relative w-[350px] h-[300px]  rounded-[20px] drop-shadow-lg cursor-pointer"
            onClick={() => router.push("/editor")}
          >
            <img
              src="/map2.jpg"
              className="absolute w-full h-full top-0 left-0 opacity-70 rounded-[20px] brightness-75"
              alt=""
            />
            <div
              className=" px-4 absolute bottom-0 bg-black/50 rounded-b-[20px] text-secondary left-0 w-full h-2/5 flex flex-col items-start justify-center"
              style={{ textShadow: "1px 1px 2px black" }}
            >
              <h2 className="text-4xl underline mb-2">Map name</h2>
              <p className="mb-4 pr-36 text-sm">
                Small description of a very good map
              </p>
            </div>
          </div>
          <div className="w-[350px] h-[300px] bg-black/15 rounded-[20px] border border-black flex justify-center items-center drop-shadow-lg">
            <p
              className="text-9xl text-primary mb-2 mr-1"
              style={{ fontFamily: "jaini, sans-serif" }}
            >
              +
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Maps;
