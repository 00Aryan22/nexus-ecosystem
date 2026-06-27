"use client";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PromptSuggestion } from "@/lib/api/founder-agent";

interface PromptSuggestionsProps {
  suggestions: PromptSuggestion[];
  disabled?: boolean;
  onSelect: (suggestion: PromptSuggestion) => void;
}

function PromptSuggestions({ suggestions, disabled, onSelect }: PromptSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="px-4 py-3 border-b border-border-muted bg-surface-slate/20">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="h-3.5 w-3.5 text-neon-purple" />
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Suggested prompts
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.slice(0, 4).map((suggestion) => (
          <Button
            key={suggestion.label}
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="h-7 text-[11px] border-border-muted hover:border-neon-purple/40 hover:bg-neon-purple/5"
            onClick={() => onSelect(suggestion)}
          >
            {suggestion.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export { PromptSuggestions };
