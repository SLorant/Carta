import React, { useRef, useState } from "react";
import ActiveUsers from "./users/ActiveUsers";
import SideBar2 from "./SideBar2";
import Dimensions from "./settings/Dimensions";
import Color from "./settings/Color";
import Text from "./settings/Text";
import Export from "./settings/Export";
import { Attributes } from "@/types/type";
import { modifyShape } from "@/lib/shapes";
import { fabric } from "fabric";

export type RightSidebarProps = {
  allShapes: Array<any>;
  elementAttributes: Attributes;
  setElementAttributes: React.Dispatch<React.SetStateAction<Attributes>>;
  fabricRef: React.RefObject<fabric.Canvas | null>;
  activeObjectRef: React.RefObject<fabric.Object | null>;
  isEditingRef: React.MutableRefObject<boolean>;
  syncShapeInStorage: (obj: any) => void;
};

const RightSideBar = ({
  allShapes,
  elementAttributes,
  setElementAttributes,
  fabricRef,
  isEditingRef,
  activeObjectRef,
  syncShapeInStorage,
}: RightSidebarProps) => {
  const [openSections, setOpenSections] = useState([false, false, false]);

  const colorInputRef = useRef(null);
  const strokeInputRef = useRef(null);

  const handleInputChange = (property: string, value: string) => {
    if (!isEditingRef.current) {
      isEditingRef.current = true;
    }
    setElementAttributes((prev) => ({
      ...prev,
      [property]: value,
    }));
    modifyShape({
      canvas: fabricRef.current as fabric.Canvas,
      property,
      value,
      activeObjectRef,
      syncShapeInStorage,
    });
  };

  return (
    <section className="absolute border-l-2 border-black top-20 right-0 bg-black/0 w-60 h-full z-50">
      <div className="w-full flex flex-col items-start pl-6 justify-center h-20 p-2 border-b-5 border-gray-400">
        <ActiveUsers />
      </div>
      <div
        className={`w-full flex flex-col ${
          openSections[0] ? "h-[500px]" : "h-18"
        } items-start pl-6 justify-between  p-2 border-b-5 border-gray-400`}
      >
        <div className="flex w-full items-start  justify-between">
          <h2 className="text-primary text-3xl">LAYERS</h2>
          <img
            src="arrow.svg"
            className={`w-10 mt-1 cursor-pointer ${
              openSections[0] ? "rotate-0" : "rotate-270"
            }`}
            alt=""
            onClick={() =>
              openSections[0]
                ? setOpenSections([false, ...openSections.slice(1)])
                : setOpenSections([true, ...openSections.slice(1)])
            }
          />
        </div>
        {openSections[0] ? (
          <SideBar2 allShapes={allShapes} />
        ) : (
          <div className="hidden">
            <SideBar2 allShapes={allShapes} />
          </div>
        )}
      </div>
      <div
        className={`w-full flex flex-col ${
          openSections[1] ? "h-[500px]" : "h-18"
        } items-start pl-6 justify-between  p-2 border-b-5 border-gray-400`}
      >
        <div className="flex w-full items-start  justify-between">
          <h2 className="text-primary text-3xl">SETTINGS</h2>
          <img
            src="arrow.svg"
            className={`w-10 mt-1 cursor-pointer ${
              openSections[1] ? "rotate-0" : "rotate-270"
            }`}
            alt=""
            onClick={() =>
              openSections[1]
                ? setOpenSections([
                    openSections[0],
                    false,
                    ...openSections.slice(2),
                  ])
                : setOpenSections([
                    openSections[0],
                    true,
                    ...openSections.slice(2),
                  ])
            }
          />
        </div>
        {openSections[1] ? (
          <>
            <Dimensions
              height={elementAttributes.height}
              width={elementAttributes.width}
              isEditingRef={isEditingRef}
              handleInputChange={handleInputChange}
            />
            <Text
              fontFamily={elementAttributes.fontFamily}
              fontSize={elementAttributes.fontSize}
              fontWeight={elementAttributes.fontWeight}
              handleInputChange={handleInputChange}
            />
            <Color
              inputRef={colorInputRef}
              attribute={elementAttributes.fill}
              placeholder="color"
              attributeType="fill"
              handleInputChange={handleInputChange}
            />
            <Color
              inputRef={strokeInputRef}
              attribute={elementAttributes.stroke}
              placeholder="stroke"
              attributeType="stroke"
              handleInputChange={handleInputChange}
            />

            <Export />
          </>
        ) : (
          <div className="hidden"></div>
        )}
      </div>
      <div className="w-full flex flex-col items-between bg-black/25  justify-between h-96  border-b-5 border-gray-400">
        <div className="flex items-center justify-between w-full pl-6 p-2">
          <h2 className="text-primary text-3xl">CHAT</h2>
          <img
            src="arrow.svg"
            className="w-10 mt-1 rotate-0"
            alt=""
            onClick={() =>
              openSections[2]
                ? setOpenSections([...openSections.slice(0, 2), false])
                : setOpenSections([...openSections.slice(0, 2), true])
            }
          />
        </div>
        <div className="flex flex-col  items-center justify-between w-full">
          <div className="flex bg-zinc-600/50 w-full h-10 mb-4">
            <p className="text-primary mt-2 ml-4">User VKI:</p>
            <p className="text-white mt-3 ml-2 text-sm">Valami szoveg</p>
          </div>
          <div className="mt-2 border-2 border-secondary rounded-lg w-[90%] h-10"></div>
          <div className="pr-4 pb-4 justify-end flex w-full ">
            <button className="mt-4 text-lg bg-primary text-background p-2 rounded-md h-8 flex justify-center items-center w-16 cursor-pointer">
              Send
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RightSideBar;
