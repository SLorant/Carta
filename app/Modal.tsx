import React, { useState } from "react";
import { auth } from "@/firebase.config";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { TextInput } from "@/components/inputs/TextInput";
import { PrimaryButton } from "@/components/general/Button";
import { createUserProfileOnRegistration } from "@/lib/profileService";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

type ModalProps = {
  type: string;
  onClose: () => void;
  setModal: React.Dispatch<React.SetStateAction<string | null>>;
  router: AppRouterInstance;
};

const Modal = ({ type, onClose, setModal, router }: ModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");

  const onLogin = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        router.push("/maps");
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(errorCode, errorMessage);
      });
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    if (!username.trim() && type === "register") {
      alert("Please enter a username!");
      return;
    }

    await createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        // Signed in
        const user = userCredential.user;

        // Create user profile with username
        if (type === "register") {
          await createUserProfileOnRegistration(user.uid, email, username);
        }

        router.push("/maps");
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(errorCode, errorMessage);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black opacity-50"></div>
      {/* Modal Content */}
      <div className="relative bg-background rounded-lg flex flex-col shadow-lg  z-10 w-[400px]">
        <h2 className="text-center text-5xl text-primary mb-4 pt-8">
          {type === "login" ? "Log in" : "Register"}
        </h2>
        <form className="flex flex-col gap-6 px-8">
          <TextInput
            label="Email"
            type="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />
          {type === "register" && (
            <TextInput
              label="Username"
              placeholder="Username"
              onChange={(e) => setUsername(e.target.value)}
            />
          )}
          <TextInput
            label="Password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            type="password"
          />
          {type === "register" && (
            <TextInput
              label="Confirm Password"
              placeholder="Confirm Password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
            />
          )}
          <div
            className={`${
              type === "register" ? "mb-8" : ""
            } flex flex-col items-center justify-center`}
          >
            <PrimaryButton
              type="submit"
              className="w-24 !text-2xl"
              onClick={type === "login" ? onLogin : onSubmit}
            >
              {type === "login" ? "Login" : "Register"}
            </PrimaryButton>
          </div>
        </form>
        {type === "login" ? (
          <>
            <div className="border border-gray-500 w-full my-8"></div>
            <div className="flex flex-col items-center justify-center w-full mb-8">
              {/*           <button
            className=" bg-secondary text-background p-2 rounded-lg h-10 flex justify-center items-center px-4"
            disabled
          >
            <p className="text-lg">
              {type === "login" ? "Sign in with Google" : "Sign up with Google"}
            </p>
          </button> */}
              <p className="mt-0 text-primary text-base">
                Not registered yet? Register
                <a
                  className="text-secondary underline cursor-pointer ml-1"
                  onClick={() => {
                    setModal("register");
                  }}
                >
                  here
                </a>
              </p>
            </div>
          </>
        ) : null}

        <button
          className="absolute top-2 right-4 text-secondary text-3xl cursor-pointer"
          style={{ fontFamily: "Recursive, sans-serif" }}
          onClick={onClose}
        >
          X
        </button>
      </div>
    </div>
  );
};

export default Modal;
