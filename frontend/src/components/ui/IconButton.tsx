// frontend/src/components/ui/IconButton.tsx
'use client';

import React from 'react';

interface IconButtonProps {
  onClick: () => void;
  title: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean; // Make the disabled prop optional
}

export const IconButton = ({ onClick, title, className, children, disabled = false }: IconButtonProps) => {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${className}`}
      disabled={disabled} // Pass the disabled prop to the underlying button element
    >
      {children}
    </button>
  );
};
