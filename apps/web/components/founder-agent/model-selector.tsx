"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, RefreshCw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

type ModelSelectorProps = {
  models: string[];
  currentModel: string;
  onSelect: (model: string) => void;
  onRefresh: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function ModelSelector({
  models,
  currentModel,
  onSelect,
  onRefresh,
  disabled,
  loading,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      const idx = models.indexOf(currentModel);
      setFocusedIndex(idx >= 0 ? idx : 0);
    } else {
      setFocusedIndex(-1);
    }
  }, [open, models, currentModel]);

  useEffect(() => {
    if (open && listRef.current && focusedIndex >= 0) {
      const items = listRef.current.querySelectorAll<HTMLButtonElement>("[role='option']");
      items[focusedIndex]?.focus();
    }
  }, [open, focusedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => (prev < models.length - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : models.length - 1));
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < models.length) {
            onSelect(models[focusedIndex]);
            setOpen(false);
          }
          break;
        case "Escape":
          e.preventDefault();
          setOpen(false);
          break;
      }
    },
    [open, focusedIndex, models, onSelect]
  );

  const displayModel = currentModel || "Select model";

  return (
    <div className="relative" ref={ref} onKeyDown={handleKeyDown}>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
          disabled={disabled || loading}
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={`Selected model: ${displayModel}`}
        >
          <Sparkles className="h-4 w-4 mr-1.5" />
          {loading ? "Loading..." : displayModel}
          <ChevronsUpDown className="h-3 w-3 ml-1 opacity-50" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
          disabled={disabled || loading}
          onClick={onRefresh}
          title="Refresh models"
          aria-label="Refresh models"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>
      {open && (
        <div
          ref={listRef}
          role="listbox"
          aria-label="Available models"
          className="absolute right-0 z-50 mt-1 w-56 max-h-60 overflow-y-auto rounded-lg border border-border bg-background shadow-lg"
        >
          {models.length === 0 ? (
            <div role="option" aria-selected={false} className="px-3 py-2 text-sm text-muted-foreground">
              No models available
            </div>
          ) : (
            models.map((m, i) => (
              <button
                key={m}
                role="option"
                aria-selected={m === currentModel}
                tabIndex={i === focusedIndex ? 0 : -1}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted focus:bg-muted focus:outline-none ${
                  m === currentModel ? "font-medium" : ""
                }`}
                onClick={() => {
                  onSelect(m);
                  setOpen(false);
                }}
              >
                <span className="flex-1 text-left font-mono text-xs truncate">{m}</span>
                {m === currentModel && (
                  <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
