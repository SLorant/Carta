import { exportToPdf } from "@/lib/utils";

import { Button } from "../ui/button";

const Export = () => {
  const handleExportToPdf = async () => {
    try {
      await exportToPdf();
    } catch (error) {
      console.error("Failed to export PDF:", error);
    }
  };

  return (
    <div className="flex flex-col gap-3 px-2 py-3 text-secondary mb-6">
      <h3 className="text-base font-bold uppercase">Export</h3>
      <Button
        variant="outline"
        className="w-full border border-primary-grey-100 text- hover:bg-secondary bg-primary text-background cursor-pointer hover:text-primary-black"
        onClick={handleExportToPdf}
      >
        Export to PDF
      </Button>
    </div>
  );
};

export default Export;
