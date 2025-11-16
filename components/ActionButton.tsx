import React from 'react';

interface ActionButtonProps {
  onClick: () => void;
  text: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, text, icon, disabled = false, className = '' }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center p-2 rounded-md text-white font-semibold transition-colors duration-200 shadow-md w-full h-full
        ${disabled
          ? 'bg-stone-600 text-stone-400 cursor-not-allowed'
          : 'bg-orange-700 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1'
        } ${className}`}
    >
      {icon && <span className="text-2xl">{icon}</span>}
      <span className="text-xs sm:text-sm">{text}</span>
    </button>
  );
};

export default ActionButton;