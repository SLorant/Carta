import { useRouter } from "next/navigation";
import React from "react";

const TopBar = ({ userName }) => {
  const router = useRouter();

  return (
    <div className="absolute z-50 px-10 bg-black/10 border-b-2 pb-4 border-black top-0 pt-2 w-full h-20 flex justify-between text-secondary ">
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
  );
};

export default TopBar;
