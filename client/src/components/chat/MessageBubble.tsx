import type { ChatMessage } from "@/lib/types";

interface MessageBubbleProps {
  message: ChatMessage;
  isUser: boolean;
}

export default function MessageBubble({ message, isUser }: MessageBubbleProps) {
  if (isUser) {
    return (
      <div className="flex items-start space-x-3 justify-end animate-slide-up">
        <div className="bg-gradient-to-r from-accent to-secondary rounded-2xl rounded-tr-md px-4 py-3 shadow-sm max-w-xs">
          <p className="text-white leading-relaxed">{message.content}</p>
        </div>
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-gray-600">👤</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-3 animate-bounce-in">
      <div className="w-10 h-10 bg-gradient-to-br from-primary to-red-400 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-white text-lg">🐱</span>
      </div>
      <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border max-w-xs">
        <p className="text-gray-800 leading-relaxed whitespace-pre-line">
          {message.content}
        </p>
      </div>
    </div>
  );
}
