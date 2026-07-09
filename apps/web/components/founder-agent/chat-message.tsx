"use client";

import { useState } from "react";
import { Bot, Check, Copy, RefreshCw, User } from "lucide-react";

import { MarkdownContent } from "@/components/founder-agent/markdown-content";
import { Button } from "@/components/ui/button";

export type ChatMessageData = {
  id: string;
  sender: "user" | "agent";
  content: string;
  timestamp: string;
  streaming?: boolean;
};

interface ChatMessageProps {
  message: ChatMessageData;
  onRetry?: (id: string) => void;
  onRegenerate?: (id: string) => void;
}

function ChatMessage({ message, onRetry, onRegenerate }: ChatMessageProps) {
  const isAgent = message.sender === "agent";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex items-start gap-3 max-w-[90%] group ${
        isAgent ? "mr-auto" : "ml-auto flex-row-reverse"
      }`}
      role="listitem"
      aria-label={`${isAgent ? "AI" : "User"} message`}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 border ${
          isAgent
            ? "bg-neon-blue/10 border-neon-blue/20 text-neon-blue"
            : "bg-neon-purple/10 border-neon-purple/20 text-neon-purple"
        }`}
        aria-hidden="true"
      >
        {isAgent ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>

      <div className="space-y-1.5 min-w-0 max-w-full">
        <div
          className={`rounded-lg p-4 leading-relaxed ${
            isAgent
              ? "bg-surface-slate/60 border border-border-muted text-foreground"
              : "bg-neon-purple/10 border border-neon-purple/10 text-foreground"
          }`}
        >
          {isAgent ? (
            <MarkdownContent content={message.content || (message.streaming ? "" : "")} />
          ) : (
            <p className="text-sm text-foreground whitespace-pre-wrap">{message.content}</p>
          )}
          {message.streaming && message.content && (
            <span className="inline-flex ml-0.5">
              <span className="animate-pulse text-neon-purple">▍</span>
            </span>
          )}
          {message.streaming && !message.content && (
            <div className="flex items-center gap-1.5 py-1" role="status" aria-label="AI is thinking">
              <span className="h-2 w-2 rounded-full bg-neon-purple/60 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-2 w-2 rounded-full bg-neon-purple/60 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-2 w-2 rounded-full bg-neon-purple/60 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          )}
        </div>
        <div className={`flex items-center gap-2 ${isAgent ? "flex-row" : "flex-row-reverse"}`}>
          <p
            className={`font-mono text-[10px] text-muted-foreground ${
              isAgent ? "text-left" : "text-right"
            }`}
          >
            {message.timestamp}
            {message.streaming ? " · Generating..." : ""}
          </p>
          {!message.streaming && message.content && isAgent && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon-xs"
                variant="ghost"
                className="h-5 w-5 text-muted-foreground hover:text-foreground"
                onClick={handleCopy}
                aria-label={copied ? "Copied" : "Copy response"}
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </Button>
              {onRegenerate && (
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="h-5 w-5 text-muted-foreground hover:text-foreground"
                  onClick={() => onRegenerate(message.id)}
                  aria-label="Regenerate response"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
          {!message.streaming && message.content && !isAgent && onRetry && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon-xs"
                variant="ghost"
                className="h-5 w-5 text-muted-foreground hover:text-foreground"
                onClick={() => onRetry(message.id)}
                aria-label="Retry message"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { ChatMessage };
