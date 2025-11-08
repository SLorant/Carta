import "../globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata = {
  title: "Carta",
  description: "Carta is the best collaborative map-making app.",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-primary-grey-200">
    <TooltipProvider>{children}</TooltipProvider>
  </div>
);

export default RootLayout;
