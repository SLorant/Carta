import { exportToPdf } from "@/lib/utils";

import { Button } from "../ui/button";

const Export = () => (
  <div className="flex flex-col gap-3 px-2 py-3 text-secondary">
    <h3 className="text-base font-bold uppercase">Export</h3>
    <Button
      variant="outline"
      className="w-full border border-primary-grey-100 text- hover:bg-secondary bg-primary text-background cursor-pointer hover:text-primary-black"
      onClick={exportToPdf}
    >
      Export to PDF
    </Button>
  </div>
);

export default Export;
