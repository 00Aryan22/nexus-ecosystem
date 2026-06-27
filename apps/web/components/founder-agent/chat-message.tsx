"use client";

import { Bot, User } from "lucide-react";

import { MarkdownContent } from "@/components/founder-agent/markdown-content";

export type ChatMessageData = {
  id: string;
  sender: "user" | "agent";
  content: string;
  timestamp: string;
  streaming?: boolean;
};

interface ChatMessageProps {
  message: ChatMessageData;
}

function ChatMessage({ message }: ChatMessageProps) {
  const isAgent = message.sender === "agent";

  return (
    <div
      className={`flex items-start gap-3 max-w-[85%] ${
        isAgent ? "mr-auto" : "ml-auto flex-row-reverse"
      }`}
    >
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full flex-shrink-0 border ${
          isAgent
            ? "bg-neon-blue/10 border-neon-blue/20 text-neon-blue"
            : "bg-neon-purple/10 border-neon-purple/20 text-neon-purple"
        }`}
      >
        {isAgent ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
      </div>

      <div className="space-y-1.5 min-w-0">
        <div
          className={`rounded-lg p-3.5 leading-relaxed ${
            isAgent
              ? "bg-surface-slate/60 border border-border-muted text-foreground"
              : "bg-neon-purple/10 border border-neon-purple/10 text-foreground"
          }`}
        >
          {isAgent ? (
            <MarkdownContent content={message.content || (message.streaming ? "▍" : "")} />
          ) : (
            <p className="text-sm text-foreground whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
        <p
          className={`font-mono text-[9px] text-muted-foreground ${
            isAgent ? "text-left" : "text-right"
          }`}
        >
          {message.timestamp}
          {message.streaming ? " · streaming" : ""}
        </p>
      </div>
    </div>
  );
}

export { ChatMessage };
