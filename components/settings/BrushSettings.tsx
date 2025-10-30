import { Label } from "../ui/label";
import { Input } from "../ui/input";

type Props = {
  brushWidth: string;
  brushColor: string;
  handleInputChange: (property: string, value: string) => void;
};

const BrushSettings = ({
  brushWidth,
  brushColor,
  handleInputChange,
}: Props) => (
  <div className="flex flex-col gap-3 border-b border-primary-grey-200 py-5 px-2 text-secondary">
    <h3 className="text-base font-bold uppercase">Brush Settings</h3>

    {/* Brush Width */}
    <div className="flex flex-col gap-2">
      <Label className="text-sm">Width</Label>
      <Input
        type="range"
        min="1"
        max="100"
        value={brushWidth}
        onChange={(e) => handleInputChange("brushWidth", e.target.value)}
        className="w-full"
      />
      <div className="text-xs text-center">{brushWidth}px</div>
    </div>

    {/* Brush Color */}
    <div className="flex flex-col gap-2">
      <Label className="text-sm">Color</Label>
      <div className="flex items-center gap-2 border border-primary-grey-200 p-2 rounded cursor-pointer">
        <input
          type="color"
          value={brushColor}
          onChange={(e) => handleInputChange("brushColor", e.target.value)}
          className="w-8 h-8 border-none cursor-pointer"
        />
        <span className="flex-1 text-xs">{brushColor}</span>
      </div>
    </div>
  </div>
);

export default BrushSettings;
