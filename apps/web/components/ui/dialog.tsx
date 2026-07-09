"use client";

import * as React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Dialog (custom modal with Framer Motion)                                  */
/* -------------------------------------------------------------------------- */

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

function Dialog({
  open,
  onClose,
  children,
  className,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
}: DialogProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  // Close on Escape & Lock scroll
  React.useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Focus trap / Focus restoration
  React.useEffect(() => {
    if (open) {
      // Eagerly focus container on open
      setTimeout(() => {
        containerRef.current?.focus();
      }, 50);
    } else {
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    }
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key === "Tab") {
      if (!containerRef.current) return;
      const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
        'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
      );
      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Content */}
          <motion.div
            ref={containerRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={ariaLabelledBy}
            aria-describedby={ariaDescribedBy}
            onKeyDown={handleKeyDown}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "relative w-full max-w-lg rounded-xl border border-border bg-surface-slate shadow-2xl focus:outline-none",
              className
            )}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("px-6 pt-6 pb-4", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="dialog-title"
      className={cn(
        "font-heading text-lg font-bold tracking-tight",
        className
      )}
      {...props}
    />
  );
}

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn("px-6 pb-6", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex justify-end gap-3 border-t border-border-muted px-6 py-4",
        className
      )}
      {...props}
    />
  );
}

interface DialogCloseButtonProps {
  onClose: () => void;
  className?: string;
}

function DialogCloseButton({ onClose, className }: DialogCloseButtonProps) {
  return (
    <button
      onClick={onClose}
      className={cn(
        "absolute right-4 top-4 rounded p-1 hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors",
        className
      )}
      aria-label="Close dialog"
    >
      <X className="h-5 w-5" />
    </button>
  );
}

export {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseButton,
};
