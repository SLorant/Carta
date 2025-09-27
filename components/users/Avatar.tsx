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
  profilePictureUrl?: string;
  userId?: string;
};

const Avatar = ({ name, otherStyles, profilePictureUrl, userId }: Props) => {
  // Use Firebase profile picture if available, otherwise fallback to Liveblocks avatar
  const avatarSrc = profilePictureUrl || 
    `https://liveblocks.io/avatars/avatar-${Math.floor(
      Math.random() * 30
    )}.png`;

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div
              className={`relative z-50 h-9 w-9 rounded-full ${otherStyles}`}
              data-tooltip={name}
            >
              <Image
                src={avatarSrc}
                fill
                className="rounded-full object-cover"
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
};

export default Avatar;
