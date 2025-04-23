import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase.config";

export const Card = ({ image, title, description }) => {
  return (
    <div className="relative w-[400px] h-[400px] rounded-[20px] bg-primary">
      <img
        className="absolute w-full h-full top-0 left-0 opacity-70 rounded-[20px] brightness-75"
        src={image}
        alt=""
      />
      <div
        className="absolute bottom-0 bg-black/50 rounded-b-[20px] text-secondary left-0 w-full h-1/3 flex flex-col items-center justify-center"
        style={{ textShadow: "1px 1px 2px black" }}
      >
        <h2 className="text-4xl underline mb-2">{title}</h2>
        <p className="mb-4 text-center px-12">{description}</p>
      </div>
    </div>
  );
};

const Homepage = () => {
  const [userName, setUserName] = useState("");
  const [modalType, setModalType] = useState<"login" | "register" | null>(null);
  const router = useRouter();

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

  const openModal = (type: "login" | "register") => {
    setModalType(type);
  };

  const closeModal = () => {
    setModalType(null);
  };

  return (
    <>
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
      <img
        className="absolute top-0 left-0 z-10 w-full h-2/5 object-cover opacity-50"
        src="/map.jpg"
        style={{
          filter:
            "blur(5px) drop-shadow(0 0 0.3rem black) grayscale(0.3) brightness(0.6)",
        }}
        alt=""
      />
      <div className="z-40 relative w-screen h-screen flex flex-col items-center justify-center">
        <div className="absolute top-6 right-20 text-secondary flex gap-10">
          {userName ? (
            <button
              className="text-4xl cursor-pointer underline"
              onClick={() => router.push("/maps")}
            >
              {userName}
            </button>
          ) : (
            <>
              <button
                className="text-4xl text-primary cursor-pointer"
                onClick={() => openModal("login")}
              >
                Log in
              </button>
              <button
                className="text-4xl cursor-pointer"
                onClick={() => openModal("register")}
              >
                Register
              </button>
            </>
          )}
        </div>
        <h1 className="text-primary text-9xl">CARTA</h1>
        <h2 className="text-secondary text-6xl">Create maps together</h2>
        <button
          className="px-8 pt-1 pb-3 bg-primary text-4xl rounded-lg text-background mt-20 cursor-pointer"
          onClick={() =>
            userName ? router.push("/maps") : setModalType("login")
          }
        >
          {userName ? "Go to your Maps" : "Try it out!"}
        </button>
        <div className="h-1/3 flex justify-center gap-20 w-full mb-16 mt-20">
          <Card
            image="/map1.jpg"
            title="Best feature"
            description="Small description of the feature, what it does, why it is the best"
          />
          <Card
            image="/map2.jpg"
            title="Best feature"
            description="Small description of the feature, what it does, why it is the best"
          />
          <Card
            image="/map3.png"
            title="Best feature"
            description="Small description of the feature, what it does, why it is the best"
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
