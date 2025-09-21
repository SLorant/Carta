import "../globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata = {
  title: "Figma Clone",
  description:
    "A minimalist Figma clone using fabric.js and Liveblocks for realtime collaboration",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-primary-grey-200">
    {/*     <Room> */}
    <TooltipProvider>{children}</TooltipProvider>
    {/*     </Room> */}
  </div>
);

export default RootLayout;
