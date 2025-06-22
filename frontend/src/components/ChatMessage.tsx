import React from 'react';
import ReactMarkdown from 'react-markdown';
import { type Message } from './ChatWindow';

const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
  const isBot = message.sender === 'bot';
  return (
    <div
      className={`px-3 py-2 rounded-lg ${
        isBot
          ? 'max-w-full self-start bg-white text-black rounded-bl-none'
          : 'max-w-[75%] self-end bg-gray-200 text-black rounded-br-none'
      }`}
    >
      {isBot ? (
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
            ol: ({ children }) => (
              <ol className="list-decimal list-inside mb-2 ml-2 space-y-1">{children}</ol>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside mb-2 ml-2 space-y-1">{children}</ul>
            ),
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            strong: ({ children }) => <strong className="font-bold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            code: ({ children }) => (
              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre className="bg-gray-100 p-2 rounded text-sm font-mono overflow-x-auto mb-2">
                {children}
              </pre>
            ),
          }}
        >
          {message.text}
        </ReactMarkdown>
      ) : (
        message.text
      )}
    </div>
  );
};

export default ChatMessage;
