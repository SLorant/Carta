import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export const PrimaryButton = ({
  children,
  className = "",
  ...props
}: ButtonProps) => {
  return (
    <button
      className={`flex-1 px-4 py-2 text-xl cursor-pointer bg-primary text-background disabled:hover:bg-primary rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-default duration-200 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const CancelButton = ({
  children,
  className = "",
  ...props
}: ButtonProps) => {
  return (
    <button
      className={`flex-1 px-4 py-2 text-xl text-secondary border border-secondary rounded-md hover:bg-neutral-700 duration-200 cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
