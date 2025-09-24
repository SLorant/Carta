import React from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  id?: string;
  error?: string;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
}

export function TextareaInput({
  label,
  id,
  error,
  className = "",
  labelClassName = "",
  inputClassName = "",
  ...props
}: TextareaProps) {
  return (
    <div className={className}>
      <label
        className={`block text-sm font-medium mb-2 text-primary ${labelClassName}`}
      >
        {label}
      </label>
      <textarea
        id={id}
        className={`w-full px-3 py-2 ring-secondary text-secondary ring rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
          error ? "ring-red-500 focus:ring-red-500" : ""
        } ${inputClassName}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}
