import React from "react";

const MapsLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-96 mt-8">
      <div className="relative w-16 h-16 mb-6">
        {/* Outer ring */}
        <div className="absolute inset-0 w-16 h-16 border-4 border-primary/20 rounded-full"></div>
        {/* Spinning primary ring */}
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary border-r-primary rounded-full animate-spin"></div>
        {/* Counter-spinning secondary ring */}
        <div
          className="absolute inset-2 w-12 h-12 border-4 border-transparent border-t-secondary border-l-secondary rounded-full animate-spin"
          style={{
            animationDirection: "reverse",
            animationDuration: "2s",
          }}
        ></div>
        {/* Inner pulsing dot */}
        <div className="absolute inset-6 w-4 h-4 bg-primary rounded-full animate-pulse"></div>
      </div>
      <p className="text-xl md:text-2xl text-secondary animate-pulse">
        Loading your maps...
      </p>
    </div>
  );
};

export default MapsLoader;
