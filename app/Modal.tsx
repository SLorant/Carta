import React, { useState } from "react";
import { auth } from "@/firebase.config";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { TextInput } from "@/components/inputs/TextInput";
import { PrimaryButton } from "@/components/general/Button";

// TODO: types
const Modal = ({ type, onClose, setModal, router }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onLogin = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        router.push("/maps");
        console.log(user);
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
      });
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    await createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        console.log(user);
        router.push("/maps");
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
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
              onChange={(e) => setPassword(e.target.value)}
              type="password"
            />
          )}
          <div className="flex flex-col items-center justify-center">
            <PrimaryButton
              type="submit"
              className="w-24 !text-2xl"
              onClick={type === "login" ? onLogin : onSubmit}
            >
              {type === "login" ? "Login" : "Register"}
            </PrimaryButton>
          </div>
        </form>
        <div className="border border-gray-500 w-full my-8"></div>
        <div className="flex flex-col items-center justify-center w-full mb-8">
          <button
            className=" bg-secondary text-background p-2 rounded-lg h-10 flex justify-center items-center px-4"
            disabled
          >
            <p className="text-lg">
              {type === "login" ? "Sign in with Google" : "Sign up with Google"}
            </p>
          </button>
          {type === "login" ? (
            <p className="mt-6 text-primary text-base">
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
          ) : null}
        </div>

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
