import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  className = "",
}: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div
        className={`relative bg-background rounded-lg px-8 pb-8 pt-4 w-full max-w-md mx-4 border border-secondary ${className}`}
      >
        <h2 className="text-3xl font-bold text-primary mb-4">{title}</h2>
        {subtitle && <p className="text-secondary mb-6">{subtitle}</p>}

        {children}
      </div>
    </div>
  );
};

export default Modal;
