"use client";

import Image from "next/image";

import { ActiveElement, ShapesMenuProps } from "@/types/type";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";

const ShapesMenu = ({
  item,
  activeElement,
  handleActiveElement,
  handleImageUpload,
  imageInputRef,
}: ShapesMenuProps) => {
  const isDropdownElem = item.value.some(
    (elem) => elem?.value === activeElement?.value
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="no-ring">
          <Button
            className="relative h-full w-full bg-transparent hover:bg-transparent"
            onClick={() =>
              handleActiveElement(item as unknown as ActiveElement)
            }
          >
            <div className="relative h-6 w-6 object-contain bg-transparent hover:bg-transparent">
              <Image
                src={isDropdownElem ? activeElement!.icon : item.icon}
                alt={isDropdownElem ? activeElement!.name : item.name}
                fill
                className={isDropdownElem ? "invert" : ""}
              />
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="absolute ml-10 -top-16 flex flex-col gap-y-1 border-none bg-black/25 py-2 text-secondary">
          {item.value.map((elem) => (
            <Button
              key={elem?.name}
              onClick={() => {
                handleActiveElement(elem);
              }}
              className={`group flex h-fit justify-between gap-10 rounded-md w-40 px-5 py-3 focus:border-none ${
                activeElement?.value === elem?.value
                  ? "bg-secondary hover:bg-secondary"
                  : "hover:bg-secondary duration-200 ease-in-out"
              }`}
            >
              <div className="flex items-center gap-2">
                <Image
                  src={elem?.icon as string}
                  alt={elem?.name as string}
                  width={20}
                  height={20}
                  className={
                    activeElement?.value === elem?.value
                      ? "invert"
                      : "group-hover:invert duration-200 ease-in-out"
                  }
                />
                <p
                  className={`text-sm  ${
                    activeElement?.value === elem?.value
                      ? "text-primary-black"
                      : "text-white group-hover:invert duration-200 ease-in-out"
                  }`}
                >
                  {elem?.name}
                </p>
              </div>
            </Button>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        type="file"
        className="hidden"
        ref={imageInputRef}
        accept="image/*"
        onChange={handleImageUpload}
      />
    </>
  );
};

export default ShapesMenu;
