import React, { useRef, useState } from "react";
import ActiveUsers from "./users/ActiveUsers";
import Layers from "./Layers";
import Dimensions from "./settings/Dimensions";
import Color from "./settings/Color";
import Text from "./settings/Text";
import Export from "./settings/Export";
import Opacity from "./settings/Opacity";
import { RightSidebarProps } from "@/types/type";
import { modifyShape } from "@/lib/shapes";
import { fabric } from "fabric";

const RightSideBar = ({
  allShapes,
  elementAttributes,
  setElementAttributes,
  fabricRef,
  isEditingRef,
  activeObjectRef,
  syncShapeInStorage,
}: RightSidebarProps) => {
  const [openSections, setOpenSections] = useState([false, false]);

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
    <section className="absolute border-l-2 border-black top-20 right-0 bg-black/0 w-60 h-full max-h-screen z-50 overflow-auto">
      <div className="w-full flex flex-col items-start pl-6 justify-center h-20 p-2 border-b-5 border-gray-400">
        <ActiveUsers />
      </div>
      <div
        className={`w-full flex flex-col ${
          openSections[0] ? "h-[500px]" : "h-18"
        } items-start px-2 justify-between  border-b-5 border-gray-400`}
      >
        <div className="flex w-full pl-6  items-start justify-between">
          <h2 className="text-primary text-3xl mt-3">LAYERS</h2>
          <img
            src="arrow.svg"
            className={`w-10 mt-3 cursor-pointer ${
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
          <Layers
            allShapes={allShapes}
            fabricRef={fabricRef}
            activeObjectRef={activeObjectRef}
            syncShapeInStorage={syncShapeInStorage}
          />
        ) : null}
      </div>
      <div className="px-2 mt-2 overflow-scroll">
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
        <Opacity
          attribute={elementAttributes.opacity}
          placeholder="opacity"
          attributeType="opacity"
          handleInputChange={handleInputChange}
        />

        <Export />
      </div>
    </section>
  );
};

export default RightSideBar;
