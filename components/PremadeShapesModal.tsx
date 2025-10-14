import React from "react";
import Image from "next/image";
import Modal from "./general/Modal";
import { Button } from "./ui/button";

interface PremadeShape {
  name: string;
  src: string;
  category: string;
}

interface PremadeShapesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectShape: (shape: PremadeShape) => void;
}

const PREMADE_SHAPES: PremadeShape[] = [
  {
    name: "Castle",
    src: "/assets/Castle2.png",
    category: "Buildings",
  },
  {
    name: "Tree",
    src: "/assets/tree.png", // We'll create this
    category: "Nature",
  },
  {
    name: "Mountain",
    src: "/assets/mountain.png", // We'll create this
    category: "Nature",
  },
];

const CATEGORIES = ["All", "Buildings", "Nature", "Symbols"];

const PremadeShapesModal = ({
  isOpen,
  onClose,
  onSelectShape,
}: PremadeShapesModalProps) => {
  const [selectedCategory, setSelectedCategory] = React.useState("All");

  const filteredShapes = PREMADE_SHAPES.filter(
    (shape) => selectedCategory === "All" || shape.category === selectedCategory
  );

  const handleShapeSelect = (shape: PremadeShape) => {
    onSelectShape(shape);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Choose Asset to place"
      subtitle="Select a shape to add to your canvas"
      className="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Category Tabs */}
        <div className="flex gap-2 border-b border-secondary/20">
          {CATEGORIES.map((category) => (
            <button
              style={{ fontFamily: "Recursive, sans-serif" }}
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors  cursor-pointer ${
                selectedCategory === category
                  ? "border-primary text-primary"
                  : "border-transparent text-secondary hover:text-primary"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Shapes Grid */}
        <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {filteredShapes.map((shape) => (
            <Button
              key={shape.name}
              onClick={() => handleShapeSelect(shape)}
              className="flex flex-col items-center p-4 h-auto bg-transparent border  cursor-pointer border-secondary/20 hover:border-primary hover:bg-secondary/10 transition-colors"
              variant="outline"
            >
              <div className="w-12 h-12 mb-2 flex items-center justify-center">
                <Image
                  src={shape.src}
                  alt={shape.name}
                  width={48}
                  height={48}
                  className="object-contain text-primary"
                />
              </div>
              <span className="text-sm text-primary mt-2">{shape.name}</span>
            </Button>
          ))}
        </div>

        {filteredShapes.length === 0 && (
          <div className="text-center py-8 text-secondary">
            No shapes found in this category.
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PremadeShapesModal;
export type { PremadeShape };
