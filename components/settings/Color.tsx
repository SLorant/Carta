import { MutableRefObject } from "react";
import { Label } from "../ui/label";

type Props = {
  inputRef: MutableRefObject<HTMLInputElement | null> | undefined;
  attribute: string;
  placeholder: string;
  attributeType: string;
  handleInputChange: (property: string, value: string) => void;
};

const Color = ({
  inputRef,
  attribute,
  placeholder,
  attributeType,
  handleInputChange,
}: Props) => (
  <div className="flex flex-col gap-3 border-b border-primary-grey-200 py-5 px-2 text-secondary">
    <div className="flex items-center justify-between">
      <h3 className="text-base font-bold uppercase">{placeholder}</h3>
      {attributeType === "stroke" &&
        attribute &&
        attribute !== "transparent" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleInputChange("stroke", "");
            }}
            className="text-red-500 hover:text-red-400 text-4xl font-bold cursor-pointer border-none rounded "
            title="Remove stroke"
          >
            ×
          </button>
        )}
    </div>
    <div
      className="flex items-center gap-2 border border-primary-grey-200  cursor-pointer"
      onClick={() => inputRef?.current?.click()}
    >
      <input
        className="cursor-pointer"
        type="color"
        value={attribute}
        ref={inputRef}
        onChange={(e) => handleInputChange(attributeType, e.target.value)}
      />
      <Label className="flex-1 cursor-pointer">{attribute}</Label>
    </div>
  </div>
);

export default Color;
