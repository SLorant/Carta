"use client";

import React from "react";

interface LoadingScreenProps {
  message?: string;
  className?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Loading...",
  className = "",
}) => {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md ${className}`}
    >
      <div className="flex flex-col items-center justify-center space-y-8">
        {/* Animated loading circles */}
        <div className="relative w-24 h-24">
          {/* Outer ring */}
          <div className="absolute inset-0 w-24 h-24 border-4 border-primary/20 rounded-full"></div>
          {/* Spinning primary ring */}
          <div className="absolute inset-0 w-24 h-24 border-4 border-transparent border-t-primary border-r-primary rounded-full animate-spin"></div>
          {/* Counter-spinning secondary ring */}
          <div
            className="absolute inset-3 w-18 h-18 border-4 border-transparent border-t-secondary border-l-secondary rounded-full animate-spin"
            style={{ animationDirection: "reverse", animationDuration: "2s" }}
          ></div>
          {/* Inner pulsing dot */}
          <div className="absolute inset-8 w-8 h-8 bg-primary rounded-full animate-pulse"></div>
        </div>

        {/* Loading text */}
        <div className="text-center space-y-3 flex items-center justify-center flex-col">
          <h2 className="text-5xl text-primary font-bold tracking-wider">
            CARTA
          </h2>
          <p className="text-2xl text-secondary normalfont animate-pulse ml-2">
            {message}
          </p>
        </div>

        {/* Animated dots */}
        {/*     <div className="flex space-x-2">
          <div
            className="w-3 h-3 bg-primary rounded-full animate-bounce"
            style={{ animationDelay: "0s" }}
          ></div>
          <div
            className="w-3 h-3 bg-primary rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-3 h-3 bg-primary rounded-full animate-bounce"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div> */}
      </div>
    </div>
  );
};

export default LoadingScreen;
