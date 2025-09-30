import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const brushTextureOptions = [
  { value: "smooth", label: "Smooth" },
  { value: "rough", label: "Rough" },
  { value: "textured", label: "Textured" },
  { value: "continental", label: "Continental" },
];

type Props = {
  brushWidth: string;
  brushColor: string;
  brushTexture: string;
  brushRoughness: string;
  handleInputChange: (property: string, value: string) => void;
};

const BrushSettings = ({
  brushWidth,
  brushColor,
  brushTexture,
  brushRoughness,
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

    {/* Brush Texture */}
    <div className="flex flex-col gap-2">
      <Label className="text-sm">Texture</Label>
      <Select
        value={brushTexture}
        onValueChange={(value) => handleInputChange("brushTexture", value)}
      >
        <SelectTrigger className="w-full border border-primary-grey-200">
          <SelectValue placeholder="Select texture" />
        </SelectTrigger>
        <SelectContent className="border-primary-grey-200 bg-primary-black text-primary-grey-300">
          {brushTextureOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="hover:bg-secondary hover:text-primary-black"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Brush Roughness */}
    <div className="flex flex-col gap-2">
      <Label className="text-sm">Roughness</Label>
      <Input
        type="range"
        min="0"
        max="100"
        value={brushRoughness}
        onChange={(e) => handleInputChange("brushRoughness", e.target.value)}
        className="w-full"
      />
      <div className="text-xs text-center">{brushRoughness}%</div>
    </div>
  </div>
);

export default BrushSettings;
