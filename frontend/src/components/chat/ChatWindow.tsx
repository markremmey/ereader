import React, { useState, useRef, useEffect } from 'react';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { handleSubscribe } from '../../api/subscription';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ScrollToBottom from './ScrollToBottom';

export type Message = {
  sender: 'user' | 'bot';
  text: string;
};

const ChatWindow: React.FC = () => {
  const { data: currentUser, isLoading } = useCurrentUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // auto-scroll whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) return <div>Loading...</div>;
  if (!currentUser?.is_subscribed) {
    return (
      <div className="subscribe-prompt">
        <p>Your account is currently <strong>free</strong>. Subscribe to access chat!</p>
        <button
          onClick={() => currentUser && handleSubscribe(currentUser)}
          disabled={!currentUser}
          className="bg-gray text-black px-4 py-2 hover:border rounded-r-md disabled:opacity-50"
        >
          Subscribe for $10/month
        </button>
      </div>
    );
  }

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 5;
    setShowScrollButton(!atBottom);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    // add user message
    setMessages((prev) => [...prev, { sender: 'user', text: inputText }]);
    setInputText('');
    setIsStreaming(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat/chat`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputText }),
      });
      if (!res.ok) throw new Error(res.statusText);

      // seed empty bot message
      setMessages((m) => [...m, { sender: 'bot', text: '' }]);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          if (chunk.trim()) {
            setMessages((m) => {
              const copy = [...m];
              const last = copy[copy.length - 1];
              copy[copy.length - 1] = {
                sender: 'bot',
                text: last.text + chunk,
              };
              return copy;
            });
          }
        }
      }
    } catch (err) {
      console.error('Streaming error:', err);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-black rounded-lg shadow-sm">
      {/* Messages container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-2 py-4 space-y-3"
      >
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input container */}
      <div className="relative border-t border-gray-300 p-2 flex items-center">
        {showScrollButton && <ScrollToBottom onClick={scrollToBottom} />}
        <ChatInput
          value={inputText}
          onChange={setInputText}
          onSend={handleSend}
          disabled={isStreaming}
        />
      </div>
    </div>
  );
};

export default ChatWindow;
