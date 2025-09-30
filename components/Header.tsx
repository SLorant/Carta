import { User } from "firebase/auth";
import { useRouter } from "next/navigation";
import React from "react";

const Header = ({ user }: { user: User }) => {
  const router = useRouter();

  return (
    <div className="absolute px-72 top-6 w-full flex justify-between text-secondary ">
      <button
        className="text-4xl text-secondary cursor-pointer opacity-50"
        onClick={() => router.push("/")}
      >
        CARTA
      </button>
      <button
        className="text-2xl cursor-pointer underline"
        onClick={() => router.push("/profile")}
      >
        {user.email}
      </button>
    </div>
  );
};

export default Header;
