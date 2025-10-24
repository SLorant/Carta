import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase.config";
import BackgroundBlur from "@/components/BackgroundBlur";
import { useUserProfile } from "@/hooks/useUserProfile";

export const Card = ({ image, title, description }) => {
  return (
    <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-[20px] bg-background shadow-md">
      <img
        className="absolute w-full object-cover h-full top-0 left-0 opacity-60 rounded-[20px] brightness-40"
        src={image}
        alt=""
      />
      <div
        className="absolute bottom-0 bg-black/50 rounded-b-[20px] text-secondary left-0 w-full h-5/12 flex flex-col items-center justify-center"
        style={{ textShadow: "1px 1px 2px black" }}
      >
        <h2 className="text-2xl md:text-4xl underline mb-2">{title}</h2>
        <p className="md:text-base text-xs mb-4 text-center px-12">
          {description}
        </p>
      </div>
    </div>
  );
};

const Homepage = () => {
  const [userName, setUserName] = useState("");
  const [modalType, setModalType] = useState<"login" | "register" | null>(null);
  const router = useRouter();
  const { profile } = useUserProfile();

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserName(profile?.username || (user.email ?? ""));
      }
    });
  }, [profile?.username]);

  // Update userName when profile changes
  useEffect(() => {
    if (profile?.username) {
      setUserName(profile.username);
    }
  }, [profile?.username]);

  const openModal = (type: "login" | "register") => {
    setModalType(type);
  };

  const closeModal = () => {
    setModalType(null);
  };

  return (
    <>
      <BackgroundBlur />
      <img
        className="absolute top-0 left-0 z-10 w-full h-3/12 lg::h-4/12 xl:h-2/5 object-cover opacity-50"
        src="/map.jpg"
        style={{
          filter:
            "blur(5px) drop-shadow(0 0 0.3rem black) grayscale(0.3) brightness(0.6)",
        }}
        alt=""
      />
      <div className="z-40 relative w-screen min-h-screen xl:pt-0 pt-40 lg:pt-40 flex flex-col items-center justify-center">
        <div className="absolute top-6 right-20 text-secondary flex gap-10">
          {userName ? (
            <button
              className="text-3xl cursor-pointer underline"
              onClick={() => router.push("/profile")}
            >
              {userName}
            </button>
          ) : (
            <>
              <button
                className="text-3xl text-primary cursor-pointer"
                onClick={() => openModal("login")}
              >
                Log in
              </button>
              <button
                className="text-3xl cursor-pointer"
                onClick={() => openModal("register")}
              >
                Register
              </button>
            </>
          )}
        </div>
        <h1 className="text-primary text-7xl xl:text-9xl">CARTA</h1>
        <h2 className="text-secondary text-4xl xl:text-6xl">
          Create maps together
        </h2>
        <button
          className="px-8 pt-2 pb-3 bg-primary text-3xl rounded-lg text-background mt-20 cursor-pointer hover:bg-secondary duration-200"
          onClick={() =>
            userName ? router.push("/maps") : setModalType("login")
          }
        >
          {userName ? "Go to your Maps" : "Try it out!"}
        </button>
        <div className="h-1/3 grid gap-y-10 lg:grid-cols-2 px-12 place-items-center xl:grid-cols-3 justify-center  w-full  xl:mb-0 mb-20 mt-20">
          <Card
            image="/card1.png"
            title="Real-time Collaboration"
            description="Work together with your team in real-time. See live cursors, instant updates, and collaborate seamlessly"
          />
          <Card
            image="/card2.png"
            title="Interactive Map Editing"
            description="Create stunning maps with powerful drawing tools, customizable shapes, layers, and more"
          />
          <Card
            image="/card3.png"
            title="Comments & Reactions"
            description="Add comments, react to them, and discuss ideas directly on your maps with threaded conversations"
          />
        </div>
      </div>
      {modalType && (
        <Modal
          type={modalType}
          onClose={closeModal}
          setModal={setModalType}
          router={router}
        />
      )}
    </>
  );
};

export default Homepage;
