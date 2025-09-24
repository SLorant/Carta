import Image from "next/image";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

type Props = {
  name: string;
  otherStyles?: string;
};

const Avatar = ({ name, otherStyles }: Props) => (
  <>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            className={`relative z-50 h-9 w-9 rounded-full ${otherStyles}`}
            data-tooltip={name}
          >
            <Image
              src={`https://liveblocks.io/avatars/avatar-${Math.floor(
                Math.random() * 30
              )}.png`}
              fill
              className="rounded-full"
              alt={name}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent className="border-none bg-primary text-black px-2.5 py-1.5 text-xs">
          {name}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </>
);

export default Avatar;
