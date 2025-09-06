import { Jaini, Recursive, Work_Sans } from "next/font/google";

import "../globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Room } from "../Room";

export const metadata = {
  title: "Figma Clone",
  description:
    "A minimalist Figma clone using fabric.js and Liveblocks for realtime collaboration",
};

const recursive = Recursive({
  variable: "--font-recursive",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jaini = Jaini({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["400"],
});

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en">
    <body className={`${recursive.className} bg-primary-grey-200`}>
      <Room>
        <TooltipProvider>{children}</TooltipProvider>
      </Room>
    </body>
  </html>
);

export default RootLayout;
