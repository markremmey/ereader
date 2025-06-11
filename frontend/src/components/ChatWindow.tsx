import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

type Message = {
  sender: 'user' | 'bot';
  text: string;
};

const ChatWindow: React.FC = () => {
  // console.log("ChatWindow")
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    // reset height to shrink when you delete text
    ta.style.height = 'auto';
    // then set it to the scrollHeight (its full content height)
    ta.style.height = ta.scrollHeight + 'px';
  }, [inputText]);
  

  // scroll handler
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    // const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 10;
    const atBottom = (el.scrollHeight - el.scrollTop <= el.clientHeight+5);
    setShowScrollButton(!atBottom);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = async () => {
    if (inputText.trim() !== '') {
      setMessages((prev) => [...prev, { sender: 'user', text: inputText }]);
      setInputText('');
      setIsStreaming(true);

      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat/chat`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ message: inputText }),
        });

        if (!res.ok) {
          throw new Error(`Failed to send message: ${res.status} ${res.statusText}`);
        }

        setMessages(m => [...m, { sender: 'bot', text: '' }]);

        const reader = res.body?.getReader();
        if (!reader) {
          throw new Error('Failed to get reader');
        }

        let done = false;
        const decoder = new TextDecoder();

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            console.log('Received chunk:', JSON.stringify(chunk)); // Debug logging with JSON to see exact content
            console.log('Chunk length:', chunk.length); // Debug chunk size
            
            // Only update if chunk has content
            if (chunk.trim().length > 0) {
              // Append the chunk to the last (bot) message
              setMessages(m => {
                const updated = [...m];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = {
                  sender: 'bot',
                  text: last.text + chunk,
                };
                return updated;
              });
            }
          }
        }

        setIsStreaming(false);
      } catch (error) {
        console.error('Error streaming response:', error);
        setIsStreaming(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-black rounded-lg shadow-sm">
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex flex-col flex-1 overflow-y-auto px-2 py-4 space-y-3"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`px-3 py-2 rounded-lg ${
              msg.sender === 'user'
                ? 'max-w-[75%] self-end bg-gray-200 text-black rounded-br-none'
                : 'max-w-[100%] self-start bg-white text-black rounded-bl-none'
            }`}
          >
            {msg.sender === 'bot' ? (
              <div className="markdown-content">
                <ReactMarkdown
                  components={{
                    // Custom styling for different elements
                    p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 ml-2 space-y-1">{children}</ol>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 ml-2 space-y-1">{children}</ul>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    strong: ({ children }) => <strong className="font-bold text-black">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                    pre: ({ children }) => <pre className="bg-gray-100 p-2 rounded text-sm font-mono overflow-x-auto mb-2">{children}</pre>
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              </div>
            ) : (
              msg.text
            )}
          </div>
        ))}
        {/* Sentinel for scrolling */}
        <div ref={bottomRef} />
      </div>
      
      <div className="relative border-t border-gray-300 p-2 flex items-center">
        
      {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="
              absolute 
              -top-8
              left-1/2          
              transform -translate-x-1/2
              bg-black
              text-white 
              p-2 
              rounded-full 
              shadow-lg 
              hover:bg-black
              z-10
            "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-5 h-5 rotate-[90deg]"
              
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h14m0 0l-6-6m6 6l-6 6"
              />
            </svg>
          </button>
        )}
        
        <textarea
          ref={textareaRef}
          rows={1}
          className="
            flex-1
            bg-gray-100 
            rounded-l-md 
            px-4 
            py-2 
            focus:outline-none 
            resize-none
            overflow-y-auto
            max-h-40
            h-auto
          "
          placeholder="Type your message…"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={isStreaming}
          className="bg-gray text-black px-4 py-2 hover:border rounded-r-md disabled:text-black disabled:opacity-100"
        >          
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-5 h-5 rotate-[-90deg]"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 12h14m0 0l-6-6m6 6l-6 6"
            />
          </svg>
        </button>
        
      </div>

    </div>
  );

};

export default ChatWindow;
