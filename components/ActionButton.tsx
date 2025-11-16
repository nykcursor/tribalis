
import React from 'react';

interface ActionButtonProps {
  onClick: () => void;
  text: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  tutorialId?: string; // New prop for tutorial targeting
  tutorialHighlightId?: string | null; // Added prop for external highlighting
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, text, icon, disabled = false, className = '', tutorialId, tutorialHighlightId }) => {
  const isHighlighted = tutorialHighlightId && tutorialHighlightId === tutorialId;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-tutorial-id={tutorialId} // Add tutorial ID here
      className={`flex flex-col items-center justify-center p-2 rounded-md text-white font-semibold transition-colors duration-200 shadow-md w-full h-full
        ${disabled
          ? 'bg-stone-600 text-stone-400 cursor-not-allowed'
          : 'bg-orange-700 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1'
        } ${className}
        ${isHighlighted ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-stone-900 z-45' : ''}
        `}
    >
      {icon && <span className="text-2xl">{icon}</span>}
      <span className="text-xs sm:text-sm">{text}</span>
    </button>
  );
};

export default ActionButton;
