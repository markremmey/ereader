import React, { useRef, useEffect } from 'react';

interface Props {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  disabled: boolean;
}

const ChatInput: React.FC<Props> = ({ value, onChange, onSend, disabled }) => {
  const ta = useRef<HTMLTextAreaElement>(null);

  // auto-grow
  useEffect(() => {
    if (!ta.current) return;
    const el = ta.current;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, [value]);

  return (
    <>
      <textarea
        ref={ta}
        rows={1}
        className="flex-1 bg-gray-100 rounded-l-md px-4 py-2 focus:outline-none resize-none overflow-y-auto max-h-40"
        placeholder="Type your message…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
      />
      <button
        onClick={onSend}
        disabled={disabled}
        className="bg-gray text-black px-4 py-2 hover:border rounded-r-md disabled:opacity-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="w-5 h-5 rotate-[-90deg]"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m0 0l-6-6m6 6l-6 6" />
        </svg>
      </button>
    </>
  );
};

export default ChatInput;
