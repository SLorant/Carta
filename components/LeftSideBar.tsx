import { navElements } from "@/constants";
import { ActiveElement, NavbarProps } from "@/types/type";
import React from "react";
import ShapesMenu from "./ShapesMenu";
import { NewThread } from "./comments/NewThread";
import { Button } from "./ui/button";
import Image from "next/image";

const LeftSideBar = ({
  activeElement,
  imageInputRef,
  handleImageUpload,
  handleActiveElement,
  handleZoomIn,
  handleZoomOut,
  handleZoomReset,
  fabricRef,
}: NavbarProps) => {
  const isActive = (value: string | Array<ActiveElement>) =>
    (activeElement && activeElement.value === value) ||
    (Array.isArray(value) &&
      value.some((val) => val?.value === activeElement?.value));

  return (
    <section className="absolute border-r-2 border-black top-18 left-0 bg-black/25 w-20 h-full z-50">
      <div className="w-full flex flex-col items-center justify-center h-16 p-2 border-b-5 border-gray-400">
        <h2 className="text-primary text-3xl">TOOLS</h2>
      </div>
      {navElements.map((item: any) => (
        <li
          key={item.name}
          onClick={() => {
            if (Array.isArray(item.value)) return;
            handleActiveElement(item);
          }}
          className={`w-full flex flex-col items-center justify-center h-16  border-b-5 border-gray-400
            ${
              isActive(item.value)
                ? "bg-secondary "
                : "hover:bg-primary-grey-200 duration-200 ease-in-out"
            }
            `}
        >
          {/* If value is an array means it's a nav element with sub options i.e., dropdown */}
          {Array.isArray(item.value) ? (
            <ShapesMenu
              item={item}
              activeElement={activeElement}
              imageInputRef={imageInputRef}
              handleActiveElement={handleActiveElement}
              handleImageUpload={handleImageUpload}
            />
          ) : item?.value === "comments" ? (
            // If value is comments, trigger the NewThread component
            <NewThread fabricRef={fabricRef}>
              <Button className="relative w-6 h-6 object-contain bg-transparent hover:bg-transparent">
                <Image
                  src={item.icon}
                  alt={item.name}
                  fill
                  className={isActive(item.value) ? "invert" : ""}
                />
              </Button>
            </NewThread>
          ) : (
            <Button className="relative w-6 h-6 object-contain bg-transparent hover:bg-transparent">
              <Image
                src={item.icon}
                alt={item.name}
                fill
                className={isActive(item.value) ? "invert" : ""}
              />
            </Button>
          )}
        </li>
      ))}

      {/* Zoom Controls */}
      <div className="absolute bottom-22 w-full flex flex-col items-center gap-2">
        {/* Zoom In Button */}
        <button
          onClick={handleZoomIn}
          className="w-full h-12 flex items-center justify-center hover:bg-primary-grey-200 cursor-pointer transition-colors duration-200 "
          title="Zoom In"
        >
          <Image
            src="/ZoomIn.svg"
            alt="Zoom In"
            width={28}
            height={28}
            className="text-white"
          />
        </button>

        {/* Zoom Out Button */}
        <button
          onClick={handleZoomOut}
          className="w-full h-12 flex items-center justify-center hover:bg-primary-grey-200 cursor-pointer transition-colors duration-200"
          title="Zoom Out"
        >
          <Image
            src="/ZoomOut.svg"
            alt="Zoom Out"
            width={28}
            height={28}
            className="text-white"
          />
        </button>

        {/* Reset Zoom Button */}
        <button
          onClick={handleZoomReset}
          className="w-full h-12 flex items-center justify-center hover:bg-primary-grey-200 cursor-pointer transition-colors duration-200"
          title="Reset Zoom (100%)"
        >
          <span className="text-secondary text-xs font-bold">1:1</span>
        </button>
      </div>
    </section>
  );
};

export default LeftSideBar;
