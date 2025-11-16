import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-2 sm:p-4">
      <div className="bg-stone-800 border-2 border-stone-900 rounded-lg shadow-xl w-full max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b-2 border-stone-900 bg-stone-900 rounded-t-lg">
          <h2 className="text-xl font-bold text-amber-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-full p-1 transition-colors duration-200"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
        <div className="p-4 flex-grow overflow-y-auto bg-stone-700">
          {children}
        </div>
        <div className="p-3 border-t-2 border-stone-900 flex justify-end bg-stone-800 rounded-b-lg">
            <button
                onClick={onClose}
                className="px-4 py-2 bg-stone-600 text-stone-100 rounded-md hover:bg-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-400"
            >
                Zavřít
            </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;