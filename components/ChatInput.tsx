import React, { useState } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled, placeholder = 'Zeptej se na radu...' }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="flex p-4 border-t-2 border-stone-900 bg-stone-800">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-grow p-2 rounded-l-md border border-stone-600 bg-stone-700 text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        className={`px-4 py-2 rounded-r-md font-semibold transition-colors duration-200
          ${disabled || !message.trim()
            ? 'bg-stone-600 text-stone-400 cursor-not-allowed'
            : 'bg-orange-600 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2'
          }`}
      >
        Odeslat
      </button>
    </div>
  );
};

export default ChatInput;