import { Label } from "../ui/label";
import { Input } from "../ui/input";

type Props = {
  attribute: string;
  placeholder: string;
  attributeType: string;
  handleInputChange: (property: string, value: string) => void;
};

const Opacity = ({
  attribute,
  placeholder,
  attributeType,
  handleInputChange,
}: Props) => {
  const displayValue = () => {
    const numValue = parseFloat(attribute);
    if (isNaN(numValue)) return "100";
    return Math.round(numValue * 100).toString();
  };

  return (
    <div className="flex flex-col gap-3 border-b border-primary-grey-200 py-5 px-2 text-secondary">
      <h3 className="text-base font-bold uppercase">{placeholder}</h3>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={displayValue()}
          min="0"
          max="100"
          step="1"
          placeholder="100"
          onChange={(e) => {
            const percentValue = parseInt(e.target.value) || 0;
            const opacityValue = Math.max(0, Math.min(100, percentValue)) / 100;
            handleInputChange(attributeType, opacityValue.toString());
          }}
          className="flex-1"
        />
        <Label className="flex h-6 w-8 items-center justify-center bg-primary-grey-100 text-[10px] leading-3">
          %
        </Label>
      </div>
    </div>
  );
};

export default Opacity;
