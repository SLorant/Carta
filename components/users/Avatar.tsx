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
  // Generate a consistent avatar number based on the user identifier
  const getConsistentAvatarNumber = (identifier: string) => {
    if (!identifier) return 0;
    // Simple hash function to convert string to number
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      hash = ((hash << 5) - hash) + identifier.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 30;
  };

  // Use Firebase profile picture if available, otherwise fallback to consistent Liveblocks avatar
  const avatarSrc =
    profilePictureUrl ||
    `https://liveblocks.io/avatars/avatar-${getConsistentAvatarNumber(userId || name)}.png`;

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div
              className={`relative z-50 h-10 w-10 rounded-full ${otherStyles}`}
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
          <TooltipContent className="border-none bg-primary text-black text-shadow-none px-2.5 py-1.5 text-xs">
            {name}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  );
};

export default Avatar;
