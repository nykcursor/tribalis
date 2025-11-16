import React from 'react';

interface ChatMessageProps {
  sender: 'user' | 'ai';
  message: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ sender, message }) => {
  const isUser = sender === 'user';
  return (
    <div className={`flex mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] p-3 rounded-lg shadow-md ${
          isUser
            ? 'bg-orange-700 text-white rounded-br-none'
            : 'bg-stone-600 text-stone-100 rounded-bl-none'
        }`}
      >
        <p className="text-sm md:text-base whitespace-pre-wrap">{message}</p>
      </div>
    </div>
  );
};

export default ChatMessage;